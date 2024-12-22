import { uploadRecording } from '../firebase'; // Ensure correct import path

let cameraRecorder, screenRecorder;
let cameraChunks = [];
let screenChunks = [];
let permissionsGranted = false;

// Utility functions to check support
const isScreenSharingSupported = () => 'getDisplayMedia' in navigator.mediaDevices;
const isCameraSupported = () => 'getUserMedia' in navigator.mediaDevices;

// Function to request permissions
export const requestPermissions = async () => {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  console.log('Device detected:', isMobile ? 'Mobile' : 'Desktop');

  let cameraPermission = false;
  let screenPermission = false;

  try {
    // Request screen sharing permission (desktop only)
    let displayStream;
    if (!isMobile && isScreenSharingSupported()) {
      console.log('Screen sharing supported, requesting permission...');
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' },
        });

        // Set up screen recorder
        screenRecorder = new MediaRecorder(displayStream);
        screenRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            screenChunks.push(event.data);
          }
        };
        screenRecorder.start();
        console.log('Screen recording started.');
        screenPermission = true;
      } catch (error) {
        console.error('Screen sharing permission denied:', error.message);
      }
    } else {
      console.log('Screen sharing not supported or mobile device detected.');
    }

    // Request camera and microphone permission
    if (isCameraSupported()) {
      console.log('Requesting camera and microphone permissions...');
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Set up camera recorder
        cameraRecorder = new MediaRecorder(userStream);
        cameraRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            cameraChunks.push(event.data);
          }
        };
        cameraRecorder.start();
        console.log('Camera recording started.');
        cameraPermission = true;
      } catch (error) {
        console.error('Camera or microphone permission denied:', error.message);
      }
    } else {
      console.log('Camera or microphone not supported on this device.');
    }
  } catch (error) {
    console.error('Error during permission request:', error.message);
    throw error;
  }

  permissionsGranted = cameraPermission && screenPermission;

  if (!permissionsGranted) {
    throw new Error('Permissions not fully granted. Please allow both screen and camera access.');
  }

  console.log('All permissions granted.');
  return permissionsGranted;
};

// Start screen and camera recording
export const startRecording = async () => {
  try {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    if (!permissionsGranted) {
      throw new Error('Permissions not granted yet. Please call requestPermissions first.');
    }

    console.log('Recorders are running...');
    // Add ESC key listener (desktop only)
    if (!isMobile) {
      document.addEventListener('keydown', handleEscKey);
    }
  } catch (error) {
    console.error('Error during startRecording:', error.message);
    alert(error.message);
    throw error;
  }
};

// Stop recording and upload the video
export const stopRecording = async (userName) => {
  try {
    console.log('Stopping recordings...');

    if (cameraRecorder && cameraRecorder.state !== 'inactive') {
      cameraRecorder.stop();
    }

    if (screenRecorder && screenRecorder.state !== 'inactive') {
      screenRecorder.stop();
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Ensure all data is available

    if (cameraChunks.length > 0) {
      const cameraBlob = new Blob(cameraChunks, { type: 'video/webm' });
      await uploadRecording(userName, cameraBlob, 'camera');
      cameraChunks = [];
      console.log('Camera recording uploaded.');
    }

    if (screenChunks.length > 0) {
      const screenBlob = new Blob(screenChunks, { type: 'video/webm' });
      await uploadRecording(userName, screenBlob, 'screen');
      screenChunks = [];
      console.log('Screen recording uploaded.');
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
      console.log('Exited fullscreen mode.');
    }

    if (!/Mobi|Android/i.test(navigator.userAgent)) {
      document.removeEventListener('keydown', handleEscKey);
    }
  } catch (error) {
    console.error('Error stopping or uploading recordings:', error.message);
  }
};

// Handle ESC key to stop recording
const handleEscKey = (event) => {
  if (event.key === 'Escape') {
    alert('Recording stopped by pressing Escape.');
    stopRecording('userNamePlaceholder'); // Replace with actual user data
  }
};

// Enter fullscreen only if permissions are granted
export const enterFullscreen = () => {
  if (permissionsGranted && !document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .then(() => console.log('Fullscreen enabled.'))
      .catch((err) => console.error('Error enabling fullscreen:', err));
  } else if (!permissionsGranted) {
    alert('Permissions not granted yet. Please allow screen sharing and camera access.');
  }
};

// Monitor special keys and notify before reloading
export const specialKeyChecks = () => {
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey && event.key === 'r') || event.key === 'F5' || event.key === 'Escape') {
      event.preventDefault();
      alert(`Special key "${event.key}" detected. Page will reload now.`);
      setTimeout(() => window.location.reload(), 2000);
    }
  });
};

// Check if permissions are granted
export const checkPermissionGranted = () => permissionsGranted;
