var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com'); //NECESSARY.  This is my custom signal server

var loginButton = document.querySelector('#loginButton'); 
var videoPage = document.querySelector('#videoPage');
var connectStatus = document.querySelector('#connectStatus');
var statusText = document.querySelector('#status');
var pauseButton = document.querySelector('#pauseButton');
var resumeButton = document.querySelector('#resumeButton');

var connectedUser, myConnection;


const proxy = new URLSearchParams(window.location.search);
	
var viewerName = proxy.get('vid');
var streamerName = proxy.get('sid');
var researcherName = proxy.get('rid');
var controllerName = proxy.get('cid');


loginButton.addEventListener("click", function()
{
	DoControllerLogin();
	loginButton.disabled = true;
	
});

pauseButton.addEventListener("click", function()
{
	console.log("Pause clicked");
	send({ type: "mute"}, streamerName);
	send({ type: "mute"}, researcherName);
});

resumeButton.addEventListener("click", function()
{
	console.log("Resume clicked");
	send({ type: "resume"}, streamerName);
	send({ type: "resume"}, researcherName);
});






//when a user logs in 
async function onLogin(success) { 

   if (success === false) { 
      alert("oops...try a different username"); 
   } 
   
   else 
   { 

		connectStatus.style.display = "none";
		videoPage.style.display = "inline";



		/*
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
		
		myConnection.addEventListener("track", e => function(e){console.log("Received."), false);

         // Setup ice handling 
        myConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }, streamerName); 
            } 
         };
		*/
   } 
};



function onAnswer(answer, otherName) { 

	MyLog(otherName + " " + researcherName);
	if(otherName === researcherName)
	{
		MyLog("Giggity");
		myResearcherConnection.setRemoteDescription(new RTCSessionDescription(answer));
		keepCallingResearcher = false;
	}
	
	MyLog("Got an Answer from " + otherName);
	
}





  
  
  
  
  
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
			onAnswer(data.answer, data.name); 
			break; 
		case "candidate": 
			onCandidate(data.candidate, data.name); 
			break; 
			
		case "leave":
			onLeave();
			break;
		default: 
			break; 
		}
   }
   catch(error){
	   //console.log("Got something not JSON");
   };
};  


function onLeave()
{
	console.log("Somebody left!!");
}


  
connection.onopen = function () { 
   MyLog("Connected to the signalling server!");
   loginButton.disabled = false;
};

connection.onerror = function (err) { 
   MyLog("Got error"); 
   MyLog(err);
};

connection.onclose = function (e) {
	MyLog("CLOSED");
	MyLog(e);
	MyLog("CLOSED COMPLETE");
};

// Alias for sending messages in JSON format 
function send(message, otherName) { 

   if (otherName) { 
      message.name = otherName; 
   } 
	
   connection.send(JSON.stringify(message)); 
};

//when somebody wants to call us 
function onOffer(offer, name) 
{ 
   connectedUser = name; 
   myConnection.setRemoteDescription(new RTCSessionDescription(offer));
	
   myConnection.createAnswer(function (answer) { 
      myConnection.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }, connectedUser); 
		
   }, function (error) {
      alert("oops...error"); 
   }); 
   
   console.log("Got an Offer from " + name);
}

//when we got ice candidate from another user 
function onCandidate(candidate, name) {
	

	if(otherName === streamerName)
	{
		myConnection.addIceCandidate(new RTCIceCandidate(candidate));
	}
	else
	{
		myResearcherConnection.addIceCandidate(new RTCIceCandidate(candidate));
	}
	//myConnections[otherName].addIceCandidate(new RTCIceCandidate(candidate));
	//myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
	MyLog("Got an ICE Candidate from " + otherName);
}



function DoControllerLogin()
{

	
   if(controllerName.length > 0){ 
      send({ 
         type: "login", 
         name: controllerName 
      }); 
   }
   
   MyLog("Logged In.");
}







function MyLog(message)
{
	console.log(message);
	statusText.innerHTML += ("<br/>" + message);
}