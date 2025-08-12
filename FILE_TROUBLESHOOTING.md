# File Sharing Troubleshooting Guide

If you're having issues with file sending and receiving, follow this guide to identify and fix the problem.

## Quick Diagnostic Steps

### 1. Check Backend Status
- Ensure your backend is running on Render.com
- Verify the backend URL is correct in your configuration
- Test backend connectivity using the debug tool

### 2. Check Configuration
- Verify your `.env.local` file has the correct backend URLs
- Ensure `VITE_HTTP_URL` points to your backend
- Ensure `VITE_WS_URL` points to your backend

### 3. Use the Debug Tool
Open `debug-file-upload.html` in your browser to test each step:
1. Test backend connection
2. Test WebSocket connection
3. Test file upload
4. Test file message sending
5. Test file download

## Common Issues and Solutions

### Issue: "File upload failed"
**Symptoms:**
- File upload returns an error
- No file appears in chat

**Possible Causes:**
1. Backend not running
2. Incorrect backend URL
3. CORS issues
4. File too large

**Solutions:**
1. Check if backend is deployed and running
2. Verify `VITE_HTTP_URL` in `.env.local`
3. Check browser console for CORS errors
4. Ensure file is under 10MB limit

### Issue: "File message not received"
**Symptoms:**
- File uploads successfully
- File message doesn't appear in chat
- Other users don't see the file

**Possible Causes:**
1. WebSocket connection issues
2. Message type handling problems
3. Backend not broadcasting file messages

**Solutions:**
1. Check WebSocket connection status
2. Verify `VITE_WS_URL` in `.env.local`
3. Check browser console for WebSocket errors
4. Test with debug tool

### Issue: "File download not working"
**Symptoms:**
- File message appears in chat
- Download button doesn't work
- File not found error

**Possible Causes:**
1. File not actually uploaded
2. Incorrect file ID
3. Backend file serving issues

**Solutions:**
1. Verify file was uploaded successfully
2. Check file ID in message
3. Test direct file download URL

## Debug Steps

### Step 1: Test Backend Connection
```bash
# Test if backend is reachable
curl https://your-backend.onrender.com/
```

### Step 2: Test File Upload
```bash
# Test file upload endpoint
curl -X POST -F "file=@test.txt" https://your-backend.onrender.com/upload
```

### Step 3: Check Configuration
Verify your `.env.local` file:
```bash
VITE_WS_URL=wss://your-backend.onrender.com
VITE_HTTP_URL=https://your-backend.onrender.com
```

### Step 4: Check Browser Console
Open browser developer tools and look for:
- Network errors
- WebSocket connection errors
- JavaScript errors

## Testing with Debug Tool

1. **Open `debug-file-upload.html`**
2. **Update URLs** to match your backend
3. **Test each step**:
   - Backend connection
   - WebSocket connection
   - File upload
   - File message sending
   - File download

## Environment-Specific Issues

### Development (Local Backend)
- Ensure backend is running on `localhost:3001`
- Check if multer is installed: `npm install multer`
- Verify uploads directory exists

### Production (Render.com)
- Check Render.com deployment status
- Verify environment variables are set
- Check Render.com logs for errors

### Netlify Deployment
- Set environment variables in Netlify dashboard
- Ensure `VITE_` prefix is used
- Check Netlify build logs

## File Size and Type Limits

- **Maximum file size**: 10MB (configurable via `VITE_MAX_FILE_SIZE`)
- **Supported file types**: Images, PDFs, text files, Office documents, archives
- **File naming**: Files are renamed with unique IDs to prevent conflicts

## Getting Help

If you're still having issues:

1. **Check the debug tool output** and share the logs
2. **Check browser console** for error messages
3. **Verify backend logs** on Render.com
4. **Test with a simple text file** first
5. **Ensure both frontend and backend are using the same configuration**

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "File upload failed" | Backend unreachable | Check backend URL and status |
| "WebSocket connection failed" | WebSocket URL incorrect | Verify `VITE_WS_URL` |
| "File too large" | File exceeds limit | Reduce file size or increase limit |
| "CORS error" | Cross-origin issue | Check backend CORS configuration |
| "File not found" | File not uploaded | Verify upload was successful |
