//var connection = new WebSocket('wss://server.saltyrtc.org:443'); 
var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com');
var name = ""; 
 
var loginInput = document.querySelector('#loginInput'); 
var loginBtn = document.querySelector('#loginBtn'); 
var otherUsernameInput = document.querySelector('#otherUsernameInput'); 
var connectToOtherUsernameBtn = document.querySelector('#connectToOtherUsernameBtn'); 
var callPage = document.querySelector('#callPage');
var loginPage = document.querySelector('#loginPage');
var videoPage = document.querySelector('#videoPage');
var myVideo = document.querySelector('#myVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var yourName = document.querySelector('#userLogin');
var statusText = document.querySelector('#status');
var videosContainer = document.querySelector('#videosContainer');
var remoteVideosContainer = document.querySelector('#remoteVideosContainer');

var connectedUser, myConnection, theStream;





///////////////////////////////////////////////////////////////
//Collect all of the streaming cameras that are found.
//This doesn't get the media; it just checks what is connected.
///////////////////////////////////////////////////////////////
var myStreamingDevices = [];
var deviceCounter = 0;



////TODO: use this to generate video tags
var receivedTracks = 0;




navigator.mediaDevices.enumerateDevices().then(function(devices) 
{
	devices.forEach(function(device) 
	{			
		if(device.kind === "videoinput")
		{
			console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
			
			myStreamingDevices[deviceCounter] = device.deviceId;
			deviceCounter++;
		}
	});
	
	console.log("We have this many devices: " + myStreamingDevices.length);
	
	for(let i = 0; i < myStreamingDevices.length; i++)
	{
		console.log(myStreamingDevices[i]);
	}
})







const constraints = window.constraints = {
  audio: false,
  video: true
};
  
  
  
//when a user clicks the login button 
loginBtn.addEventListener("click", function(event){ 

   name = loginInput.value; 
	
   if(name.length > 0){ 
      send({ 
         type: "login", 
         name: name 
      }); 
   }
   
   callPage.style.display = "inline";
   loginPage.style.display = "none";
   userLogin.innerHTML = loginInput.value;
	
});




//setup a peer connection with another user 
connectToOtherUsernameBtn.addEventListener("click", function () {
  
	console.log("The call button was clicked");
	callPage.style.display = "none";
	videoPage.style.display = "inline";
	
  
   var otherUsername = otherUsernameInput.value;
   connectedUser = otherUsername;
	
   if (otherUsername.length > 0) { 
      //make an offer 
      myConnection.createOffer(function (offer) { 
         console.log(); 
			
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         myConnection.setLocalDescription(offer); 
		 console.log(myConnection);
      }, function (error) { 
         alert("An error has occurred."); 
      }); 
   } 
});
  
  
  
  
  
//handle messages from the server 
connection.onmessage = function (message) { 
   //console.log("Got message", message.data);
   
   try{
		var data = JSON.parse(message.data); 
	
		switch(data.type) { 
		case "login": 
			onLogin(data.success); 
			break; 
		case "offer": 
			onOffer(data.offer, data.name); 
			break; 
		case "answer": 
			onAnswer(data.answer); 
			break; 
		case "candidate": 
			onCandidate(data.candidate); 
			break; 
		default: 
			break; 
		}
   }
   catch(error){
	   //console.log("Got something not JSON");
   };
};





async function receiveVideo(e){
	
	remoteVideosContainer.innerHTML += '<video id="remote'+receivedTracks+'" muted autoplay></video>';
	
	var ms = new MediaStream();
	ms.addTrack(e.track);
	
	document.querySelector('#remote'+receivedTracks).srcObject = ms;
	//remoteVideo.srcObject = ms;
	
	receivedTracks++;
}








//when a user logs in 
async function onLogin(success) { 



   if (success === false) { 
      alert("oops...try a different username"); 
   } 
   
   else 
   { 


         //using Google public stun server 
         var configuration = { 
            "iceServers": 
			[
				{'urls': 'stun:stun1.l.google.com:19302'}, 
				{'urls': 'stun:stun2.l.google.com:19302'},
				{'urls': 'stun:stun3.l.google.com:19302'}, 
				{'urls': 'stun:stun4.l.google.com:19302'},
				{'urls': 'turn:3.13.58.4:3478?transport=tcp', username: "dude", credential: "dude"}
			]
         }; 
		 
		 
		myConnection = new RTCPeerConnection(configuration); 

		myConnection.addEventListener("track", e => receiveVideo(e).then({
			
			
			
		}), false);

			
         //when a remote user adds stream to the peer connection, we display it 
         myConnection.onaddstream = function (e) {  
		 console.log("giggity");
            //remoteVideo.srcObject = e.stream;
			console.log("Bruh");
		 };

         // Setup ice handling 
         myConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };  	



	for(let i = 0; i < myStreamingDevices.length; i++)
	{
		var vidyaID = "video"+i;
		 console.log("Vidya id: " + vidyaID);
		 videosContainer.innerHTML += '<video id="'+vidyaID+'" muted autoplay></video>';
	}
	
	for(let i = 0; i < myStreamingDevices.length; i++)
	{
		
		 //getting local video stream 
		 
		 const gumStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: myStreamingDevices[i]}}});
		 
		 var vidyaID = "video"+i;
		 document.querySelector('#'+vidyaID).srcObject = gumStream;
		 
		 for(const track of gumStream.getTracks())
		 {
			 myConnection.addTrack(track);
		 }
		 
		 //await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: myStreamingDevices[i]}}}).then(function(myStream){
      //navigator.getUserMedia({ video: true, audio: true	  }, function (myStream) { 
         //theStream = myStream;		 
		 
		 
		 
			
         //displaying local video stream on the page 
         //myVideo.srcObject = theStream;
			

		         // setup stream listening 
         //myConnection.addStream(myStream); 
         
      //}, function (error) { 
         //console.log(error); 
      //}); 
	}
		


   } 
};















  
  
  
  
  
  
  
connection.onopen = function () { 
   console.log("Connected to the signalling server"); 
   statusText.innerHTML = "Connected to the signalling server!";
};
  
  
  
  
  
  
connection.onerror = function (err) { 
   console.log("Got error", err); 
};
  
  
  
  
  
// Alias for sending messages in JSON format 
function send(message) { 

   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   connection.send(JSON.stringify(message)); 
};













  
//when somebody wants to call us 
function onOffer(offer, name) { 
   connectedUser = name; 
   myConnection.setRemoteDescription(new RTCSessionDescription(offer));
	
   myConnection.createAnswer(function (answer) { 
      myConnection.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("oops...error"); 
   }); 
   
   console.log("Got an Offer from " + name);
}




//when another user answers to our offer 
function onAnswer(answer) { 
   myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
   console.log("Got an Answer");
}
  
  
  
  
//when we got ice candidate from another user 
function onCandidate(candidate) { 
   myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
   console.log("Got an ICE Candidate");
}
















//creating data channel 
function openDataChannel() { 

console.log("Open Data Channel fired");

   var dataChannelOptions = { 
      reliable:true 
   }; 
	
   dataChannel = myConnection.createDataChannel("myDataChannel", dataChannelOptions);
	
   dataChannel.onerror = function (error) { 
      console.log("Error:", error); 
   };
	
   dataChannel.onmessage = function (event) { 
      console.log("Got message:", event.data); 
   };  
}