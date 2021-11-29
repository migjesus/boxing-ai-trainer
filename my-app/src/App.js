import ml5 from "ml5";
import Sketch from "react-p5";
import "react-p5/node_modules/p5/lib/addons/p5.sound";
import annyang from "annyang";
import mostCommon from "array-most-common";
import { constants } from "./constants";

const { TOTAL_GAME_TIME, VIDEO_HEIGHT, VIDEO_WIDTH, POSSIBLE_POSES, FPS } =
  constants;

const VIDEO_SETTINGS = {
  video: {
    audio: false,
    height: VIDEO_HEIGHT,
    width: VIDEO_WIDTH,
    maxFrameRate: FPS,
  },
};

const App = () => {
  let video;
  let poseNet;
  let pose;
  let skeleton;
  let neuralNetwork;
  let sequence = [];
  let randomPose = "d";
  let cool = false;
  let timer = TOTAL_GAME_TIME;
  let movementCount = 0;
  let debugMode = false;
  let intervalId;
  let bell;

  const setup = (p5, canvasParentRef) => {
    if (annyang) {
      //TODO different commands should have different functions
      let commands = {
        fight: () => onPlayButtonClick(),
        stop: () => onPlayButtonClick(),
        draw: () => (debugMode = !debugMode),
        erase: () => (debugMode = !debugMode),
      };
      annyang.addCommands(commands);
      annyang.start();
    }
    bell = p5.loadSound("sound/bell.mp3");
    p5.frameRate(FPS);
    p5.createCanvas(VIDEO_WIDTH, VIDEO_HEIGHT).parent(canvasParentRef);
    p5.background(51);
    video = p5.createCapture(VIDEO_SETTINGS);
    video.position(0, 0);
    video.hide();
    createButtonGroup(p5);
    poseNet = ml5.poseNet(video);
    poseNet.on("pose", getData);
    let options = {
      inputs: 22,
      outputs: 4,
      task: "classification",
      debug: true,
    };
    neuralNetwork = ml5.neuralNetwork(options);
    const modelSpecs = {
      model: "model/model.json",
      metadata: "model/model_meta.json",
      weights: "model/model.weights.bin",
    };
    neuralNetwork?.load(modelSpecs);
  };

  const createButtonGroup = (p5) => {
    const buttonGroup = p5.createDiv();
    buttonGroup.style("display", "flex");
    buttonGroup.style("direction", "row");
    buttonGroup.style("margin", "20px");
    const playButton = p5.createButton("Fight & Stop");
    const debugButton = p5.createButton("Draw & Erase");
    playButton.parent(buttonGroup);
    debugButton.parent(buttonGroup);
    playButton.mousePressed(() => onPlayButtonClick());
    debugButton.mousePressed(() => (debugMode = !debugMode));
  };

  const onPlayButtonClick = () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
      timer = TOTAL_GAME_TIME;
      bell.play();
    } else {
      movementCount = 0;
      bell.play();
      intervalId = setInterval(timeIt, 1000);
    }
  };

  const timeIt = () => {
    if (timer > 0) {
      timer--;
    }
  };

  const classifyData = () => {
    if (pose && pose.keypoints) {
      let inputs = [];
      for (let i = 0; i < 11; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      neuralNetwork.classify(inputs, getLabel);
    } else {
      classifyData();
    }
  };

  const getLabel = (error, results) => {
    if (error) {
      console.log("error");
      return;
    }
    if (results !== undefined && results.lenght !== 0) {
      sequence.push(results[0].label);
    }
    if (sequence.length === 5) {
      if (mostCommon(sequence) === randomPose) {
        cool = true;
        timer !== 30 && movementCount++;
        randomPose = POSSIBLE_POSES.filter((pose) => pose !== randomPose)[
          Math.floor(
            Math.random() *
              POSSIBLE_POSES.filter((pose) => pose !== randomPose).length
          )
        ];
      }
      sequence = [];
    }
  };

  const getData = (poses) => {
    if (poses.length === 0) {
      pose = {};
    } else {
      pose = poses[0].pose;
      skeleton = poses[0].skeleton;
      classifyData();
    }
  };

  const draw = (p5) => {
    if (true) {
      p5.push();
      p5.translate(VIDEO_WIDTH, 0);
      p5.scale(-1, 1);
      p5.image(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      if (pose !== undefined && pose.keypoints) {
        debugMode && drawSkeleton(p5, pose.keypoints);
        p5.pop();
        if (cool) {
          p5.fill(0, 255, 0);
          //TODO delay this a bit more
          cool = false;
        } else {
          p5.fill(255, 0, 255);
        }
        p5.noStroke();
        p5.textSize(100);
        p5.textAlign("CENTER", "CENTER");
        p5.text(randomPose, VIDEO_WIDTH / 2 + 220, VIDEO_HEIGHT / 2 - 110);
        p5.textSize(40);
        p5.fill(255, 0, 0);
        p5.text(`Time: ${timer}`, VIDEO_WIDTH / 2 + 160, VIDEO_HEIGHT / 2 - 70);
        p5.textSize(25);
        p5.fill(255, 0, 255);
        p5.text(
          `Score: ${movementCount}`,
          VIDEO_WIDTH / 2 - 310,
          VIDEO_HEIGHT / 2 - 170
        );
        p5.fill(255, 0, 255);
        p5.ellipse(VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2 - 20, 80, 80);
      }
      if (timer === 0) {
        onPlayButtonClick();
      }
    }
  };

  const drawSkeleton = (p5, keypoints) => {
    for (let i = 0; i < keypoints.length; i++) {
      let x = keypoints[i].position.x;
      let y = keypoints[i].position.y;
      p5.fill(0, 255, 0);
      p5.ellipse(x, y, 16, 16);
    }

    for (let i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      p5.strokeWeight(2);
      p5.stroke(255);
      p5.line(a.position.x, a.position.y, b.position.x, b.position.y);
    }
  };

  return (
    <div>
      <p className="title">AI Boxing Trainer</p>
      <Sketch setup={setup} draw={draw} />
    </div>
  );
};

export default App;
