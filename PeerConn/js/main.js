
const webcamButton = document.getElementById("webcamButton");
const callButton = document.getElementById("callButton");
const myVideo = document.getElementById("myVid");
const otherVideo = document.getElementById("otherVid");


const servers = {
	'iceServers': [
	{
			'urls': ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
	}
	]
};

var pc = new RTCPeerConnection(servers);
var localStream = null;
var remoteStream = null;


pc.onaddstream = function() {
	console.log("stream was added");
};

pc.onicecandidate = function() {
	console.log("ice candidate received");
};

pc.message = function() {
	console.log("Message received");
};



webcamButton.onclick = async() => {
	//local stream
	
	localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
	localStream.getTracks().forEach(track => {
		pc.addTrack(track, localStream);
	});
	
	myVideo.srcObject = localStream;


	
	
	
	//remote stream
	
	/*	
	pc.ontrack = event => {
		event.streams[0].getTracks().forEach(track => {
			remoteStream.addTrack(track);
		});
	};
	*/
	remoteStream = new MediaStream();
	otherVideo.srcObject = remoteStream;
	
};
