document.addEventListener('DOMContentLoaded', function() {

try {
  let app = firebase.app();
} catch (e) {
  console.error(e);
}

// Parameters about Firebase service
// 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
const firestore = firebase.firestore();
const firebasestorage = firebase.storage();
const usersCollection = firestore.collection("CrossCorrUsersExample");
const trialsCollection = firestore.collection("CrossCorrTrialsExample");
var waitSeconds = 30; //instruction waiting time (in seconds)
const debugMode = 0; // if 1 then allow skipping trials
// 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥


// Experimental paramters
const projectVersion = 'crossCorrLag100ms';  // Name the project
const continuousOrCategory = 'continuous'; // continuous or category, this will invoke different rating methods.
const targetPicsURL = 'https://storage.googleapis.com/storage/v1/b/targetpics/o?key=AIzaSyCq_5MXe9UtGhH-X0wdnRb_4ggcGFNqPlE&maxResults=2500';
const playlistBaseline = 'https://storage.googleapis.com/storage/v1/b/baseline34videos30fps/o?key=AIzaSyCq_5MXe9UtGhH-X0wdnRb_4ggcGFNqPlE&maxResults=2500';
const playlistWithLag = 'https://storage.googleapis.com/storage/v1/b/baseline34videos30fps100ms/o?key=AIzaSyCq_5MXe9UtGhH-X0wdnRb_4ggcGFNqPlE&maxResults=2500';
const practiceBaseline = 'https://storage.googleapis.com/practicevideos/Exp2_pra_baseline_1cbr_30fps_withAudio.mp4'

const experimentTime = 60; // how long the experiment will last (in minutes)
var MAX_TRIALS = 2; // number of trials
const throttleTime = 0.02; // how much time to throttle in seconds; This determines the sampling rate of mouse pointer positions
const TimeStillLimit = 20; // The time limit for how long participants haven't been moving the mouse pointer. Negative feedback will be given if it exceeds this limit
const baselineRatio =  1/2; // if mixing videos between different conditions, the ratio of videos from one condition
var longestTimeStill = 0;
var randomID; // for a random ID assigned to each participant for credit granting purpose

// Instruction URLs
const controlURL = 'https://docs.google.com/document/d/e/2PACX-1vSBkqT6TyKDCgF8Kg2G5A_kCstSpiI8K2waCeiRE1xnp-teNQdRzshhwc75JjXSgSgXEiKd8EIPjJon/pub?embedded=true';
const controlHref = 'https://docs.google.com/document/d/1fhAMgbWbA0L7kepjLT03vsc551OlcCx2JuDxL-j7fy0/edit?usp=sharing'

// Rating grid parameters
// Do not modify if you don't know what you are doing
const valenceDirection = Math.round(Math.random()); // if 0 then negative on the right and positive on the left // if 1 then negative on the left and positive on the right
const categoryOrder_v = Math.round(Math.random()); 
const categoryOrder_a = Math.round(Math.random());
var practiceId;
var playlistId_1;
var playlistId_2;
var instructionURL;
var instructionHref;
const showText = true;
var wedgesAngle = [[-18,-54,-90],[-126,-162,162],[126,90],[54,18]];
var categoriesAngle = [[0,-36,-72],[-108, -144,-180],[144,108], [72,36]];
var categoryLabels = [['Surprised','Happy','Excited'],['Fearful', 'Angry','Disgusted'],
['Sad','Bored'], ['Calm','Contented']];
var categoryNum = 10;
var emotionAngles_corrected = categoriesAngle;

// Canvas parameters
var div_width = 900;
var div_height = 720;
var videoPlayer;
var gratingGrid;
var gratingCanvas; // for drawing context
var gridCanvas; // for position and css
var gridTop;
var gridLeft;
var canvasTop;
var canvasLeft;
var gridWidth;
var gridEdge;
var gridMargin = 5;
var textMargin = 100;
const pointerSize = 10;
let videoCtx;
const squareRatio = 5/7;
const gridRatio = 3/4;
var mouseCentered = false;
const mouseCenterZone = 0.2;
const crossLength = 50;


//Mouse pointer parameters
var mousePosX;
var mousePosY;
var mouseTime;
var mousePosXSave;
var mousePosYSave;
var mouseTimeSave;
var distanceFromCenterX;
var distanceFromCenterY;
const startKey = 13; // enter key
const pauseKey = 32; // space
const endKey = 27; // esc key
var valenceRating;
var arousalRating;
var emotionLabel;
let trialStart = 0;// Trial start time
let currentTrial = 0;
let currentTrialData = newCurrentTrialData();
var randFeedback = 1;
var monitorFPS;


// Function that returns a Promise for the FPS of subject's monitor
const getFPS = () =>
  new Promise(resolve =>
    requestAnimationFrame(t1 =>
      requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
    )
  )


// Function to shuffle the items in a vector
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


// initialize a user dict
determineCondition();
var user = {
  info: {},
  trialVideos: [],
  targetPics:[],
  currentTrial: 0,
  projectVersion: projectVersion,
  valenceDirection: valenceDirection,
  continuousOrCategory:continuousOrCategory,
  playlistId_1:playlistWithLag,
  playlistId_2:playlistBaseline,
  practiceId:practiceId,
  targetPicsURL:targetPicsURL,
  monitorFPS:monitorFPS,
};


// Things to do when the first webpage is ready
$(document).ready(function() {
  $('#consent_yes').click(function() {disableStart(false);});
  $('#consent_no').click(function() {disableStart(true);});
  $('#agreeAndStart').click(function() {showPage(1);})

  videoPlayer = $('#videoPlayer');
  gratingGrid = $('#gratingGrid');
  gridCanvas = $('#gridCanvas');

  const throttledMouseHandler = _.throttle(mouseMoveHandler, throttleTime*1000);
  document.addEventListener("mousemove", e => throttledMouseHandler(e)); 

  if (!debugMode){
    preventNavigation();
    $("#agreeAndStart").attr("disabled", true);
  }else{
    $("#agreeAndStart").attr("disabled", false);
  }
  
  showPage(0);
  $('.totalNumber').text(MAX_TRIALS);
  $('.totalTime').text(experimentTime);
  registerHandlers();
  infoFormHandler();

  window.onresize = function(event){
    div_width = document.getElementById('videoContainer').offsetWidth;
    div_height = document.getElementById('videoContainer').offsetHeight;
    alignElements();
  };

});


// this function makes sures that elements will be aligned automatically when subjects resize the browser window
function alignElements(){
  videoPlayer.attr('width', div_width);
  gratingGrid.attr('height', Math.floor(div_height*gridRatio));
  gridCanvas.attr('height', gratingGrid.attr('height'));
  gridCanvas.attr('width', gratingGrid.attr('height'));

  // make gratingGrid and gratingCanvas the same size
  videoPlayer.css({
    padding: '0px',
    position: 'absolute',
    zIndex: 1,
    top: '50%',  /* position the top  edge of the element at the middle of the parent */
    left: '50%', /* position the left edge of the element at the middle of the parent */
    transform: 'translate(-50%, -50%)' /* This is a shorthand of translateX(-50%) and translateY(-50%) */
  });

  gratingGrid.css({
    position: 'absolute',
    zIndex: 1,
    top: '50%',  
    left: '50%', 
    transform: 'translate(-50%, -50%)'
  });

  gridCanvas.css({
    position: 'absolute',
    zIndex: 1,
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)'
  });

  gridTop = gratingGrid.position().top;
  gridLeft = gratingGrid.position().left;
  canvasTop = $('#videoContainer').position().top;
  canvasLeft = $('#videoContainer').position().left;
  gridWidth = gratingGrid.width();
  gridEdge = gridWidth*(1-squareRatio)/2;
}


// Function to create a new playlist from two playlists
// It randomly selects a ratio of videos from playlist 1 and the rest from playlist 2 and shuffle the order of videos
function combinePlaylist(idBlur, idBaseline, baselineRatio){
  return Promise.all([$.getJSON(idBlur),$.getJSON(idBaseline)])
    .then(function(values) {
      var numTrials = values[1].items.length;
      shuffledIndex = _.shuffle(_.range(numTrials));
      var middleIndex = Math.floor(numTrials*(1-baselineRatio));
      var firstSlice = shuffledIndex.slice(0, middleIndex);
      var secondSlice = shuffledIndex.slice(middleIndex, shuffledIndex.length)
      var selected_1 = _.at(values[0].items, firstSlice);
      var selected_2 = _.at(values[1].items, secondSlice);
      const combined = _.shuffle(selected_1.concat(selected_2));
      return {items: combined};
  });
}


// Function to get videos given a Google cloud storage bucket ID
function getPlaylist(id) {
  return $.getJSON(id).then(function(message) {
    message.items = _.shuffle(message.items);
    console.log(message);
    return message;
  }).catch(function(err) {
    console.error(err);
    throw err;
  });
}


// Function to get pictures given a Google cloud storage bucket ID
function getTargetPicList(id){
  return $.getJSON(id).then(function(message) {
    message.items = _.shuffle(message.items);
    console.log(message);
    return message;
  }).catch(function(err) {
    console.error(err);
    throw err;
  });
}


// Function to get the image containing the target character's profile that corresponds to the video
function getTargetImage(videoNum){
  var targetIndex = user.targetPics.findIndex(item => item['name'] === videoNum.concat('.png'));;
  var targetLink = user.targetPics[targetIndex]['mediaLink'];
  $('#imageTrack').attr('src',targetLink);
}


// Function to set certain parameters about experimental conditions
function determineCondition(){
  playlistId_1 =  playlistWithLag;
  playlistId_2 = playlistBaseline;
  practiceId = practiceBaseline;
  instructionURL = controlURL;
  instructionHref = controlHref;

  if (continuousOrCategory === 'category'){
    for (i=0;i<categoryLabels.length;i++){
      for (j=0;j<categoryLabels[i].length;j++){
        var anglesToDraw = categoriesAngle[i][j];
        if (categoryOrder_a == 1){
          anglesToDraw = -anglesToDraw;
        }
        if (categoryOrder_v == 1){
          if (anglesToDraw<=0){
            anglesToDraw = anglesToDraw - 2*(anglesToDraw + 90);
          }else{
            anglesToDraw = anglesToDraw + 2*(90 - anglesToDraw);
          }
        }
        emotionAngles_corrected[i][j] = anglesToDraw;
      }
    }
  }

}

// Function to call for beginning a trial
function beginTrial() {

  getFPS().then(fps => currentTrialData.monitorFPS = fps);

  $('#trialNumber').text(currentTrial + 1);
  const videoId = _.get(user.trialVideos[currentTrial], 'mediaLink');
  const videoName = _.get(user.trialVideos[currentTrial], 'name');
  
  currentTrialData.videoName = videoName;
  currentTrialData.videoLink = videoId;

  if (!videoId) {
    window.alert('Could not load video!');
    return;
  }
  videoPlayer.attr('src',videoId);
  var videoNum = videoName.slice(0,8);

  if (user.continuousOrCategory === 'continuous'){
    if (user.valenceDirection === 0){
      $('#emotionSpaceImage').attr('src','https://storage.googleapis.com/ratinggridpic/arousal_valence_rightPos.png');
      gratingGrid.attr('src','https://storage.googleapis.com/ratinggridpic/Rating_grid_rightPos.png');
    }
    else{
      $('#emotionSpaceImage').attr('src','https://storage.googleapis.com/ratinggridpic/arousal_valence_rightNeg.png');
      gratingGrid.attr('src','https://storage.googleapis.com/ratinggridpic/Rating_grid_rightNeg.png');
    }

  }else if (user.continuousOrCategory === 'category'){
    if (categoryOrder_v === 0 && categoryOrder_a === 0){
      gratingGrid.attr('src','https://storage.googleapis.com/ratinggridpic/Rating_circle_rightPos_upLow.png');
    } else if (categoryOrder_v === 0 && categoryOrder_a === 1){
      gratingGrid.attr('src','https://storage.googleapis.com/ratinggridpic/Rating_circle_rightPos_upHigh.png');
    } else if (categoryOrder_v === 1 && categoryOrder_a === 0){
      gratingGrid.attr('src','https://storage.googleapis.com/ratinggridpic/Rating_circle_rightNeg_upLow.png');
    } else if (categoryOrder_v === 1 && categoryOrder_a === 1){
      gratingGrid.attr('src','https://storage.googleapis.com/ratinggridpic/Rating_circle_rightNeg_upHigh.png');
    }
  }

  emotionLabel = 'Neutral';
  getTargetImage(videoNum);

  trialStart = Date.now(); //get start time of the trial
  showPage(4);

  // determine what instructions to show
  $('#VideoReady').show();
  $('#VideoPlaying').hide();
  $('#MovieInstruction').show();  
  $('#InstructionBaseline').show();
  $('#characterInvisible').show();
  $('#imageTrack').show();

  div_width = document.getElementById('videoContainer').offsetWidth;
  div_height = document.getElementById('videoContainer').offsetHeight;
  alignElements();
}


// Create a new currentTrialData object to store trial related data
function newCurrentTrialData() {
  return {
    _id: '',
    userId: '',
    randomID: '',
    trialEntries: [],
    survey: {},
    longestTimeStill: 0,
    duration: 0,
    videoName: '',
    videoLink: '',
    trialNumber: 0,
    monitorFPS: 0,
  };
}


// Submit a trial
function submitTrial(){
  $("#submitTrial").prop('disabled', true);
  currentTrialData.longestTimeStill = longestTimeStill;
  currentTrialData.duration = (Date.now() - trialStart)/1000; // turn into miliseconds
  currentTrialData.userId = user._id;
  currentTrialData.trialNumber = currentTrial;
  currentTrialData._id = currentTrialData.userId + '_' + currentTrialData.trialNumber;
  currentTrialData.randomID = user.info.randomID;

  console.log(user);
  console.log(currentTrialData);

  $("#uploading").show();
  firestore.runTransaction(function(transaction) {
    return transaction.get(usersCollection.doc(user._id))
      .then(function(userDoc) {
        transaction.update(usersCollection.doc(user._id), {
          currentTrial: firebase.firestore.FieldValue.increment(1),
        }).set(trialsCollection.doc(currentTrialData._id), currentTrialData);
    });
  }).then(function() {
    console.log('transaction complete');
    currentTrial += 1;
    longestTimeStill = 0;
    currentTrialData = newCurrentTrialData(); 
    $('#surveyForm')[0].reset();
    if (currentTrial === MAX_TRIALS) {
      $('.randomID').text(user.info.randomID);
      showPage(7);
    } else {
      showPage(6);
      if (user.continuousOrCategory === 'category'){
        $('#emotionSpaceInstruction').hide();
        $('#emotionSpaceImage').hide();
      }
    }
  }).catch(function(err) {
    console.error("transaction failed:", err);
    console.alert("Failed to save data, please try again");
  }).finally(function() {
    $("#uploading").hide();
    $("#submitTrial").prop('disabled', false);
  });
}


// handlers to bind button to certain JS functions
function registerHandlers() {
  $('#showInstruction').click(showInstruction);
  $('#beginTrial').click(beginTrial);
  $('#startTrial').click(beginTrial);
  $('#showSubjectInfo').click(function(){showPage(3);});
}

function infoFormHandler() {
  showJustEmail();
  $('#submitForm').click(checkEmail);
  $('#submitTrial').click(checkForm);  
}


// show instruction page 
function showInstruction(){
  showPage(2);
  $('#instructionDoc')[0].contentWindow.location.replace(instructionURL);
  $('#viewInstructionButton').attr('href', instructionHref);
  var interval = setInterval(function() {
    if (!waitSeconds) {
      clearInterval(interval);
      $('#showSubjectInfo').text('Next');
    } else {
      $('#showSubjectInfo').text(String(waitSeconds) + ' sec to begin');
      waitSeconds--;
    }
  }, 1000);
  setTimeout(function() {
    $('#showSubjectInfo').prop('disabled', false);
  }, waitSeconds * 1000);
}


// event listener for things to do when the video ends playing
document.getElementById('videoPlayer').addEventListener('ended', function(e){
  var lastEntry = _.last(currentTrialData.trialEntries);
  if (lastEntry) {
    var diffTime = (videoPlayer.get(0).currentTime - lastEntry.mouseTimeSave);
    if (diffTime > longestTimeStill){
      longestTimeStill = diffTime;
    }  
  }
  showPage(5);
  $('#longestTimeStill').html(Math.round(longestTimeStill));
  randFeedback = Math.floor((Math.random() * 5) + 1);
  $('#encourage1').hide();
  $('#encourage2').hide();
  $('#encourage3').hide();
  $('#encourage4').hide();
  $('#encourage5').hide();
  $('#badJob1').hide();
  $('#badJob2').hide();
  if ((longestTimeStill)>TimeStillLimit){
    $('#badJob1').show();
    $('#badJob2').show();
  }else{
    $('#encourage'+randFeedback).show();
  }
  $("#submitTrial").prop('disabled', false);
});


// event listener for subjects to press the enter key to start videos
document.addEventListener("keyup", function(e) {
  var ev = e || window.event; // window.event for IE fallback
  if(ev.keyCode === startKey && videoPlayer.get(0).paused && mouseCentered) {
    videoPlayer.get(0).play();
    $('#VideoReady').hide();
    $('#VideoStart').hide();
    $('#MovieInstruction').show();
    $('#VideoPlaying').show();
  }
  if (ev.keyCode === pauseKey && !videoPlayer.get(0).paused && debugMode) {
    videoPlayer.get(0).pause();
    $('#VideoStart').show();
    $('#MovieInstruction').hide();
  }  

  // skipping a video for debugging reasons 
  if (debugMode){ 
    if (ev.keyCode === endKey) {
      videoPlayer.get(0).pause();
      var lastEntry = _.last(currentTrialData.trialEntries);
      if (lastEntry) {
        var diffTime = (videoPlayer.get(0).currentTime - lastEntry.mouseTimeSave);
        if (diffTime > longestTimeStill){
          longestTimeStill = diffTime;
        }  
      }
      showPage(5);
    }
  }
});


// saving mouse positions once the video starts playing
// throttler controls the interval the function 'mouseMoveHandler' gets executed
function mouseMoveHandler(event) {
  var ev = event || window.event;
  mousePosXSave = ev.pageX;
  mousePosYSave = ev.pageY;
  mouseTimeSave = videoPlayer.get(0).currentTime;

  if (!videoPlayer.get(0).paused){
    var lastEntry = _.last(currentTrialData.trialEntries);
    if (lastEntry) {
      var diffTime = (mouseTimeSave -lastEntry.mouseTimeSave);
      if (diffTime > longestTimeStill){
        longestTimeStill = diffTime;
      }  
    }

    mouseTimeSave = Math.round(mouseTimeSave*100)/100;
    if (user.continuousOrCategory === 'continuous'){
      valenceRating = Math.round(valenceRating*1000)/1000;
      arousalRating = Math.round(arousalRating*1000)/1000;
      currentTrialData.trialEntries.push({valenceRating,arousalRating,mouseTimeSave,mousePosXSave,mousePosYSave});
    }else if (user.continuousOrCategory === 'category'){
      currentTrialData.trialEntries.push({emotionLabel,mouseTimeSave,mousePosXSave,mousePosYSave});
    }
  } 
};


// getting mouse positions all the time
document.addEventListener("mousemove", function(event){
  var ev = event || window.event;
  mousePosX = ev.pageX;
  mousePosY = ev.pageY;
  mouseTime = videoPlayer.get(0).currentTime;

  gratingCanvas =  document.getElementById('gridCanvas');
  videoCtx = gratingCanvas.getContext('2d');
  videoCtx.clearRect(0,0,gratingCanvas.width, gratingCanvas.height);

  if (user.continuousOrCategory === 'continuous'){

    arousalRating = (gridTop+gridWidth/2-mousePosY)/(gridWidth*squareRatio/2);
    if (user.valenceDirection === 0){
        valenceRating = (mousePosX - gridLeft - gridWidth/2 - canvasLeft)/(gridWidth*squareRatio/2);
    }else{
        valenceRating = (canvasLeft + gridLeft + gridWidth/2 - mousePosX)/(gridWidth*squareRatio/2);
    }
    if (Math.abs(arousalRating)<=mouseCenterZone && Math.abs(arousalRating)<=mouseCenterZone){
      mouseCentered = true;
    }else{
      mouseCentered = false;
    }
  }else if (user.continuousOrCategory === 'category'){
    distanceFromCenterX = (mousePosX - gridLeft - gridWidth/2 - canvasLeft)/(gridWidth*squareRatio/2);
    distanceFromCenterY = (gridTop+gridWidth/2-mousePosY)/(gridWidth*squareRatio/2);
    var distanceFromCenter = Math.pow(Math.pow(distanceFromCenterX,2) + Math.pow(distanceFromCenterY,2),0.5);
    if (distanceFromCenter<=mouseCenterZone){
      mouseCentered = true;
    }else{
      mouseCentered = false;
    }
    var angleFromZero_sin = Math.asin(distanceFromCenterY/distanceFromCenter)*180/Math.PI;
    var angleFromZero_cos = Math.acos(distanceFromCenterX/distanceFromCenter)*180/Math.PI;
    var angleFromZero = Math.sign(angleFromZero_sin)*angleFromZero_cos;
    var innerCircleRadius = 1/3;
    for (i=0;i<categoryLabels.length;i++){
      for (j=0;j<categoryLabels[i].length;j++){
        if (distanceFromCenter <= innerCircleRadius){
          emotionLabel = 'Neutral';
        }else{
          if (Math.abs(angleFromZero - emotionAngles_corrected[i][j]) <= 18){
            emotionLabel = categoryLabels[i][j];
          }
        }
      }
    }
  }

  if (user.continuousOrCategory === 'continuous'){
    drawMouseLinesGrid();
  }else if (user.continuousOrCategory === 'category'){
    drawMouseLinesCircle();
  }

  function drawMouseLinesCircle(){
    var sum_temp = Math.pow(distanceFromCenterX,2) + Math.pow(distanceFromCenterY,2);
    if (sum_temp < 1){
      // drawing the mouse pointer
      videoCtx.fillStyle="#FF0000";
      videoCtx.fillRect(mousePosX - gridLeft - pointerSize/2 - canvasLeft, mousePosY - gridTop - pointerSize/2, pointerSize, pointerSize);
      videoCtx.stroke();
      videoCtx.font = "20px Arial";
      videoCtx.fillStyle = "red";

      if(emotionLabel && showText){
        videoCtx.fillText('Emotion category: ' + emotionLabel, gridWidth/2, textMargin*2/3);
      }

    }else{
      videoCtx.font = "30px Arial";
      videoCtx.fillStyle = "red";
      videoCtx.textAlign="center"; 
      videoCtx.fillText("OUT OF BOUNDS",gratingCanvas.width/2, gratingCanvas.height/2);
    }

  }

  function drawMouseLinesGrid(){
    if (mousePosX >= (gridLeft + gridEdge - gridMargin+ canvasLeft) && mousePosX <= (gridLeft + gridWidth- gridEdge + gridMargin+ canvasLeft) && 
      mousePosY >= (gridTop + gridEdge- gridMargin) && mousePosY <= (gridTop + gridWidth- gridEdge+gridMargin)) {

      // drawing the vertical dashed line
      videoCtx.strokeStyle="gray";
      videoCtx.setLineDash([10, 10]);
      videoCtx.beginPath();
      videoCtx.moveTo(mousePosX-gridLeft- canvasLeft, gridEdge);
      videoCtx.lineTo(mousePosX-gridLeft- canvasLeft, gridWidth-gridEdge);
      videoCtx.stroke();

      // drawing dashed line
      videoCtx.setLineDash([10, 10]);
      videoCtx.beginPath();
      videoCtx.moveTo(gridEdge, mousePosY-gridTop);
      videoCtx.lineTo(gridWidth-gridEdge, mousePosY-gridTop);
      videoCtx.stroke();

      // drawing the mouse pointer
      videoCtx.fillStyle="#FF0000";
      videoCtx.fillRect(mousePosX - gridLeft - pointerSize/2 - canvasLeft, mousePosY - gridTop - pointerSize/2, pointerSize, pointerSize);
      videoCtx.stroke();

      if (valenceRating && showText){
        videoCtx.font = "18px Arial";
        videoCtx.fillStyle = "red";
        videoCtx.fillText('Valence: ' + String(Math.round(valenceRating*100)) + '%', textMargin, textMargin/3);
        videoCtx.fillText('Arousal: ' + String(Math.round(arousalRating*100)) + '%', textMargin, textMargin*2/3);
      }
    }else{
      videoCtx.font = "30px Arial";
      videoCtx.fillStyle = "red";
      videoCtx.textAlign="center"; 
      videoCtx.fillText("OUT OF BOUNDS",gratingCanvas.width/2, gratingCanvas.height/2);
    }
  }
});



// create a user profile once the subject enters their email 
function createUser() {
  // Get all the forms elements and their values in one step
  var values = $("#infoForm").serializeArray();

  var allPresent = [];
  _.each(values, function(val) {
    allPresent.push(val.value.length > 0);
    user.info[val.name] = val.value;
  });
  randomID = Math.floor(((Math.random()+0.1)*1000000));
  user.info['randomID'] = randomID;

  //check if all inputs are present
  allPresent = allPresent.every(function (e) {
    return e;
  });

  if (!debugMode){
    if (!allPresent) {
      alert('Please Fill in All Fields');
      return;
    }
  }

  user._id = user.info.email;

  //record screen fps
  getFPS().then(fps => user.monitorFPS = fps);

  combinePlaylist(user.playlistId_1, user.playlistId_2, baselineRatio).then(message => {
    // find a sequence and arrange the video order
    user.trialVideos.push({mediaLink:user.practiceId, name:'Exp2_pra.mp4'});
    Array.prototype.push.apply(user.trialVideos, message.items);
    // update trialSequence
    getTargetPicList(user.targetPicsURL).then(message => {
      user.targetPics = message.items;
      createEntry(usersCollection, user).then(message => {
        if (message) {
          beginTrial();
        }
      });
    });
  });
}


// check if all fields have been filled out in the survey form
function checkForm() {
  // Get all the forms elements and their values in one step
  var values = $("#surveyForm").serializeArray();
  var allPresent = [];
  _.each(values, function(val) {
    allPresent.push(val.value.length > 0);
    user.info[val.name] = val.value;
  });

  //check if all inputs are present
  allPresent = allPresent.every(function (e) {
    return e;
  });

  if (!debugMode){
    if (!allPresent) {
      alert('Please Fill in All Fields');
      return;
    }
  }

  currentTrialData.survey = values;
  submitTrial();  
}


// check if subject's email have been entered in the database before
// if no, create a new user file; if yes, load the subject's progress by reading in their file
function checkEmail(){
  // Get all the forms elements and their values in one step
  var values = $("#infoForm").serializeArray();
  var email = values[0].value;

  if (debugMode && !email) {
    email = "DEBUG_ID";
    $('#email-input').val(email);
  }

  if (!email) {
    alert("Username cannot be empty!");
    return;
  }

  getEntry(email).catch(error => {
    // Email not found, better enter all info
    var alertStr = 'Looks like you are participating for the first time. Please create a new profile.'
    window.alert(alertStr);
    showAllFields();
    $('#submitForm').off('click');
    $('#submitForm').click(createUser);
  }).then(message => {
    // Emails exists, continue?
    if (message) {
      var alertStr = 'Profile exists. Experiment will continue where you left off.'; 
      user = message;
      currentTrial = user.currentTrial;
      window.alert(alertStr);
      if (currentTrial === MAX_TRIALS) {
        $('.randomID').text(user.info.randomID);
        showPage(7);
      }else{
        beginTrial();
      }
      
    }
  });
}


// get an entry from the firebase database
function getEntry(id) {
  return usersCollection.doc(id).get().then(function(doc) {
    if (!doc.exists) {
      throw Error(`Document ${id} not found`);
    }
    console.log(doc.data());
    return doc.data();
  }).catch(function(err) {
    console.error(err);
    throw err;
  });
}


// update an entry in the firebase database
function updateEntry(collection, id, entry) {
  return collection.doc(id).update(entry)
    .then(function() {
      console.log(entry);
    })
    .catch(function(err) {
      console.error(err);
      throw err;
    });
}


// create an entry in the firebase database
function createEntry(collection, entry) {
  return collection.doc(entry._id).set(entry)
    .then(function() {
      console.log(entry);
      return true;
    })
    .catch(function(err) {
      console.error(err);
      throw err;
    });
}


// show a specific html page
function showPage(pageNumber) {
  const pages = $('.page');
  _.forEach(pages, (p, index) => {
    if (index === pageNumber) {
      $(p).show();
    } else {
      $(p).hide();
    }
  });
}


// format the time in videos
function formatPlayerTime(timestamp) {
  var minute = Math.floor(timestamp / 60);
  var seconds = Math.floor(timestamp % 60);
  var milliseconds = (timestamp % 1) * 1000;
  return moment().startOf('day')
          .minutes(minute)
          .seconds(seconds)
          .milliseconds(milliseconds)
          .format('mm:ss.SSS');
}


// get the time in videos
function getPlayerTime(element) {
  var timestamp = videoPlayer.get(0).currentTime;
  timestamp = formatPlayerTime(timestamp);
  element.val(timestamp);
}


// disable a button
function disableStart(shouldDisable) {
  $('#agreeAndStart').prop('disabled', shouldDisable);
}


// show only the email field but not the other fields when subjects enter information
function showJustEmail() {
  $('#infoForm .formField#email').siblings().hide();
  $('#formText').hide();
}


// show all fields
function showAllFields() {
  $('#infoForm .formField').show();
  $('#formText').show();
}


// A window will pop up if subjects try to close the webpage.
function preventNavigation() {
  // Enable navigation prompt
  window.onbeforeunload = function() {
      return true;
  };
}

});