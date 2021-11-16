
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

let pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;



webcamButton.onclick = async() => {
	localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
	remoteStream = new MediaStream();
	
	localStream.getTracks().foreach(track => {
		pc.addTrack(track, localStream);
	});
	
	pc.ontrack = event => {
		event.streams[0].getTracks().forEach(track => {
			remoteStream.addTrack(track);
		});
	};
	
	myVideo.srcObject = localStream;
	otherVideo.srcObject = remoteStream;
	
};
