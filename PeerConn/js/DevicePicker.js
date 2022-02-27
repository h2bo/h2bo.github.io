//NECESSARY.  This is my custom signal server
var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com');

//document selector for the status text.
var statusText = document.querySelector('#status');
var dropDown = document.querySelector('#options');
var theVid = document.querySelector('#theVid');

var connectedUser;

var name = "";

///////////////////////////////////////////////////////////////
//Collect all of the streaming cameras that are found.
//This doesn't get the media; it just checks what is connected.
///////////////////////////////////////////////////////////////
var myStreamingDevices = [];
var currentStreamingTrackNum = 0;
var myStreamingTracks = [];
var mySortedTracks = [];

var deviceCounter = 0;
var myAudioDevice;
var theViewerSender;
var theResearcherSender;




var gotAudio = false;

	navigator.mediaDevices.enumerateDevices().then(function(devices) 
	{
		devices.forEach(function(device) 
		{
			if(device.kind === "videoinput")
			{
				if(device.label.includes("USB") || device.label.includes("C270"))
				{
					var option = document.createElement("option");
					option.text = device.label;
					option.value = device.deviceId;
					dropDown.add(option);
					
					MyLog("Awesome thingy: " + device.label);
					myStreamingDevices[deviceCounter] = device.deviceId;
					deviceCounter++;
				}
			}
			else if(device.kind === "audioinput")
			{
				MyLog(device);
				if(device.label.includes("Intel"))
				if(!gotAudio)
				{
					myAudioDevice = device;
					gotAudio = true;
					MyLog("Got an audio");
				}
			}
		
			//console.log(device);
		});
	})
	


async function DoChange()
{
	MyLog("Changed to: " + dropDown.value);
	var gumStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: dropDown.value}}});
	
	try{
		
		MyLog(gumStream);
	
	theVid.srcObject = gumStream;
	theVid.play();
	}
	catch(e)
	{
		MyLog(e);
	}
	
};



dropDown.onchange = DoChange;


function MyLog(message)
{
	console.log(message);
	statusText.innerHTML += ("<br/>" + message);
}