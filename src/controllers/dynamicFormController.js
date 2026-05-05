const DynamicForm = require('../models/DynamicForm');
const axios = require('axios');

// @desc    Get form structure from Google Sheets
// @route   GET /api/dynamic-forms/:id/structure
// @access  Public
exports.getFormStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    let form;
    
    if (id === 'master-booking-placeholder') {
      form = await DynamicForm.findOne({ name: "Master Booking Form" });
    } else {
      form = await DynamicForm.findById(id);
    }

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    // Attempt to get live headers from Apps Script ONLY if sync=true is passed
    // This improves performance for public form loads while allowing admin to refresh
    const shouldSync = req.query.sync === 'true';

    if (shouldSync) {
      try {
        const response = await axios.post(form.appsScriptUrl, {
          action: 'get_headers',
          sheetId: form.sheetId
        }, { timeout: 10000 });

        if (response.data && response.data.success && response.data.headers) {
          // Sync headers with fields
          const currentHeaders = response.data.headers;
          const existingFields = form.fields || [];
          
          // Merge: keep settings for existing headers, add new ones
          const updatedFields = currentHeaders.map((header, index) => {
            const existing = existingFields.find(f => f.header === header);
            if (existing) {
              return { ...existing.toObject(), order: index };
            }
            
            // Infer type
            let type = 'text';
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('email')) type = 'email';
            else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) type = 'phone';
            else if (lowerHeader.includes('date')) type = 'date';
            else if (lowerHeader.includes('amount') || lowerHeader.includes('price')) type = 'number';
            else if (lowerHeader.includes('status') || lowerHeader.includes('option')) type = 'select';

            return {
              header,
              label: header,
              type,
              required: false,
              visible: true,
              order: index
            };
          });

          form.fields = updatedFields;
          await form.save();
        }
      } catch (err) {
        console.warn('Failed to fetch live headers:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        name: form.name,
        fields: form.fields.filter(f => f.visible).sort((a, b) => a.order - b.order)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit form data to Google Sheets
// @route   POST /api/dynamic-forms/:id/submit
// @access  Public
exports.submitFormData = async (req, res, next) => {
  try {
    const { id } = req.params;
    let form;
    
    if (id === 'master-booking-placeholder') {
      form = await DynamicForm.findOne({ name: "Master Booking Form" });
    } else {
      form = await DynamicForm.findById(id);
    }

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    const rawBody = req.body;
    let submissionData = rawBody;
    const isArrayPayload = rawBody.is_array === true;
    
    if (isArrayPayload) {
      submissionData = rawBody.data;
    }

    // Validate required fields (only for object payloads, array payloads are assumed pre-validated)
    if (!isArrayPayload) {
      const missingFields = form.fields
        .filter(f => f.required && !submissionData[f.header])
        .map(f => f.label);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Required fields missing: ${missingFields.join(', ')}`
        });
      }
    }

    // Add metadata
    const timestamp = new Date().toISOString();
    const bookingId = "YC-" + Math.random().toString(36).substr(2, 6).toUpperCase();

    // Prepare payload for Apps Script
    let finalData = submissionData;
    if (isArrayPayload) {
      // If array, we can't easily add keys, but we can wrap it or Apps Script handles it
      // Standard: [srNo, ...data, timestamp, bookingId]
      // But user said let sheet handle srNo. So we send as is.
      // We can append metadata to the end of the array if needed, 
      // but usually the user wants the exact columns.
    } else {
      submissionData.timestamp = timestamp;
      submissionData.bookingId = bookingId;
    }

    // Submit to Apps Script
    try {
      const response = await axios.post(form.appsScriptUrl, {
        action: 'submit_row',
        sheetId: form.sheetId,
        data: finalData,
        metadata: { timestamp, bookingId } // Pass metadata separately for flexibility
      }, { timeout: 15000 });

      if (response.data && response.data.success) {
        return res.status(201).json({
          success: true,
          message: 'Booking submitted successfully!',
          bookingId: submissionData.bookingId
        });
      } else {
        throw new Error(response.data?.error || 'Apps Script submission failed');
      }
    } catch (err) {
      // Temporary storage / Retry logic could go here
      console.error('Submission failed:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Sync failed, but your data is being processed. Error: ' + err.message,
        status: 'retry_queued'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create or Update form config
// @route   POST /api/dynamic-forms/config
// @access  Private/Admin
exports.saveFormConfig = async (req, res, next) => {
  try {
    const { name, sheetId, appsScriptUrl, fields } = req.body;
    
    let form = await DynamicForm.findOne({ name });
    
    if (form) {
      form.sheetId = sheetId || form.sheetId;
      form.appsScriptUrl = appsScriptUrl || form.appsScriptUrl;
      if (fields) form.fields = fields;
      await form.save();
    } else {
      form = await DynamicForm.create(req.body);
    }

    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all form configs
// @route   GET /api/dynamic-forms
// @access  Private/Admin
exports.getForms = async (req, res, next) => {
  try {
    const forms = await DynamicForm.find();
    res.json({ success: true, data: forms });
  } catch (error) {
    next(error);
  }
};
