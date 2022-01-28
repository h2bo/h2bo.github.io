/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: true,
  video: true
};


const servers = {'iceServers': [{'urls': 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'}]};


let pc = new RTCPeerConnection(servers);



function handleSuccess1(stream) {
  const video = document.getElementById('gum1');
  
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  //console.log(`other vidya device: ${videoTracks[1].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}

function handleSuccess2(stream) {
  const video = document.getElementById('gum2');
  
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  //console.log(`other vidya device: ${videoTracks[1].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}

function handleSuccess3(stream) {
  const video = document.getElementById('gum3');
  
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  //console.log(`other vidya device: ${videoTracks[1].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  if (error.name === 'OverconstrainedError') {
    const v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'NotAllowedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

async function init(e) {
  try {
    //const stream = await navigator.mediaDevices.getUserMedia(constraints);
	var countIndex = 1;
	var stream1;
	var stream2;
	var stream3;
	
	
	var device1;
	var device2;
	var device3;
	
	navigator.mediaDevices.enumerateDevices().then(function(devices) 
	{
		devices.forEach(function(device) 
		{
			console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
	
			if(device.kind === "audioinput")
				return;
		
			console.log("USING THIS: ");
		
			if(countIndex == 1)
				device1 = device.deviceId;
	
			if(countIndex == 2)
				device2 = device.deviceId;
	
			if(countIndex == 3)
				device3 = device.deviceId;
				//stream3 = navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: device.deviceId}}});
		
			countIndex++;
			
		});
	})
	
	
	
	stream1 = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: device1}}});
	stream2 = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: device2}}});
	stream3 = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: device3}}});
	
	
    //handleSuccess(stream);
	
	handleSuccess1(stream1);
	handleSuccess2(stream2);
	handleSuccess3(stream3);
    e.target.disabled = true;
	
  } catch (e) {
    handleError(e);
  }
}

document.querySelector('#showVideo').addEventListener('click', e => init(e));
document.getElementById("kevinStatus").innerHTML = 'Hello11';