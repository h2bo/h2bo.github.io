//NECESSARY.  This is my custom signal server
var connection = new WebSocket('wss://obscure-sierra-55073.herokuapp.com');

//document selector for the status text.
var statusText = document.querySelector('#status');
var dropDown = document.querySelector('#options');
var theVid = document.querySelector('#theVid');

var startButton = document.querySelector('#startVideos');
var vid0Options = document.querySelector('#vid0Options');
var vid1Options = document.querySelector('#vid1Options');
var vid2Options = document.querySelector('#vid2Options');
var vid3Options = document.querySelector('#vid3Options');
var saveButton = document.querySelector('#saveButton');


///////////////////////////////////////////////////////////////
//Collect all of the streaming cameras that are found.
//This doesn't get the media; it just checks what is connected.
///////////////////////////////////////////////////////////////
var myStreamingDevices = [];
var mySortedTracks = [];

var deviceCounter = 0;
var myAudioDevice;




var gotAudio = false;

	navigator.mediaDevices.enumerateDevices().then(function(devices) 
	{
		devices.forEach(function(device) 
		{
			if(device.kind === "videoinput")
			{
				if(device.label.includes("USB") || device.label.includes("C270"))
				{
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
	
	
	
	
startButton.addEventListener("click", ShowCams);
saveButton.addEventListener("click", SaveConfig);
	



async function ShowCams()
{
	for(var i = 0; i < myStreamingDevices.length; i++)
	{
		var selector = "#vid" + i;
		console.log(selector);
		var currVid = document.querySelector(selector);
		
		var gumStream = await navigator.mediaDevices.getUserMedia({ video: {deviceId: {exact: myStreamingDevices[i]}}}).then(function(stream){
			
			currVid.srcObject = stream;
			currVid.play();
		});		
	}
}




function SaveConfig()
{
	var a = vid0Options.value;
	var b = vid1Options.value;
	var c = vid2Options.value;
	var d = vid3Options.value;
	
	if(a === b || a === c || a === d || b === c || b === d || c === d)
	{
		alert("Duplicate video mapping");
		return;
	}

	mySortedTracks[a] = myStreamingDevices[0];
	mySortedTracks[b] = myStreamingDevices[1];
	mySortedTracks[c] = myStreamingDevices[2];
	mySortedTracks[d] = myStreamingDevices[3];
	
	console.log("front: " +  mySortedTracks[0]); //front
	console.log("behind: " + mySortedTracks[1]); //behind
	console.log("left: " +   mySortedTracks[2]); //left
	console.log("right: " +  mySortedTracks[3]);	//right
}
	


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


function MyLog(message)
{
	console.log(message);
	statusText.innerHTML += ("<br/>" + message);
}