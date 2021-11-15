import ml5 from "ml5";
import Sketch from "react-p5";
import mostCommon from "array-most-common";
import { constants } from "./constants";

const {
  TOTAL_GAME_TIME,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  POSSIBLE_POSES,
  STATE: { WAITING, COLLECTING },
  FPS,
} = constants;

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
  let state = WAITING;
  let targetLabel;
  let sequence = [];
  let randomPose = "d";
  let cool = false;
  let running = false;
  let timer = TOTAL_GAME_TIME;
  let movementCount = 0;
  let debugMode = false;

  const keyPressed = (event) => {
    if (event.key === "s") {
      neuralNetwork.saveData();
    } else {
      targetLabel = event.key;
      console.log(targetLabel);
      setTimeout(() => {
        console.log("collecting");
        state = COLLECTING;
        setTimeout(() => {
          console.log("not collecting");
          state = WAITING;
        }, 60000);
      }, 10000);
    }
  };

  const setup = (p5) => {
    p5.frameRate(FPS);
    p5.createCanvas(VIDEO_WIDTH, VIDEO_HEIGHT);
    p5.background(51);
    video = p5.createCapture(VIDEO_SETTINGS);
    video.position(0, 0);
    video.hide();
    createButtonGroup(p5);
    p5.noLoop();
  };

  const createButtonGroup = (p5) => {
    const buttonGroup = p5.createDiv();
    buttonGroup.style("display", "flex");
    buttonGroup.style("direction", "row");
    const playButton = p5.createButton("Play | Reset");
    const debugButton = p5.createButton("Debug");
    const trainButton = p5.createButton("Train");
    playButton.parent(buttonGroup);
    debugButton.parent(buttonGroup);
    trainButton.parent(buttonGroup);
    playButton.mousePressed(() => onPlayButtonClick(p5));
    debugButton.mousePressed(() => (debugMode = !debugMode));
    trainButton.mousePressed(() => onTrainButtonClick());
  };

  const onPlayButtonClick = (p5) => {
    if (!running) {
      poseNet = ml5.poseNet(video);
      poseNet.on("pose", getData);
      let options = {
        inputs: 22,
        outputs: 5,
        task: "classification",
        debug: true,
      };
      neuralNetwork = ml5.neuralNetwork(options);
      const modelSpecs = {
        model: "mini/model.json",
        metadata: "mini/model_meta.json",
        weights: "mini/model.weights.bin",
      };
      neuralNetwork?.load(modelSpecs, classifyData);
      running = true;
      p5.loop();
    } else {
      running = false;
      timer = TOTAL_GAME_TIME;
      poseNet?.removeListener("pose", getData);
      p5.background(51);
      p5.noLoop();
    }
  };

  const onTrainButtonClick = () => {
    let options = {
      inputs: 22,
      outputs: 4,
      task: "classification",
      debug: true,
    };
    neuralNetwork = ml5.neuralNetwork(options);
    neuralNetwork.loadData("mini.json", train);
  };

  const classifyData = () => {
    if (pose && pose.keypoints && running && timer !== 0) {
      let inputs = [];
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      neuralNetwork.classify(inputs, getLabel);
    } else if (!running || timer === 0) {
      return;
    } else {
      setTimeout(classifyData, 100);
    }
  };

  const getLabel = (error, results) => {
    if (results !== undefined && results.lenght !== 0) {
      sequence.push(results[0].label);
    }
    if (sequence.length === 20) {
      if (mostCommon(sequence) === randomPose) {
        cool = true; // turn poseLabel green
        movementCount++;
        randomPose = POSSIBLE_POSES.filter((pose) => pose !== randomPose)[
          Math.floor(
            Math.random() *
              POSSIBLE_POSES.filter((pose) => pose !== randomPose).length
          )
        ];
      }
      sequence = [];
    }
    classifyData();
  };

  const train = () => {
    neuralNetwork.normalizeData();
    neuralNetwork.train({ epochs: 30 }, saveModel);
  };

  const saveModel = () => {
    neuralNetwork.save();
  };

  const getData = (poses) => {
    if (poses.length === 0) {
      pose = {};
    }
    if (poses.length > 0) {
      pose = poses[0].pose;
      skeleton = poses[0].skeleton;
      if (state === COLLECTING) {
        let inputs = [];
        for (let i = 0; i < 11; i++) {
          let x = pose.keypoints[i].position.x;
          let y = pose.keypoints[i].position.y;
          inputs.push(x);
          inputs.push(y);
        }
        let target = [targetLabel];
        neuralNetwork.addData(inputs, target);
      }
    }
  };

  const draw = (p5) => {
    if (running) {
      p5.push();
      p5.translate(VIDEO_WIDTH, 0);
      p5.scale(-1, 1);
      p5.image(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      if (pose !== undefined && pose.keypoints) {
        debugMode && drawSkeleton(p5, pose.keypoints);
        p5.pop();
        if (cool) {
          p5.fill(0, 255, 0);
          //to do delay this a bit more
          cool = false;
        } else {
          p5.fill(255, 0, 255);
        }
        p5.noStroke();
        p5.textSize(100);
        p5.textAlign("CENTER", "CENTER");
        p5.text(randomPose, VIDEO_WIDTH / 2 + 220, VIDEO_HEIGHT / 2 - 110);
        p5.textSize(40);
        p5.text(timer, VIDEO_WIDTH / 2 + 225, VIDEO_HEIGHT / 2 - 70);
        p5.ellipse(VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2 - 20, 80, 80);
        p5.frameCount % FPS === 0 && timer > 0 && timer--;
      }
      if (timer === 0) {
        running = false;
        timer = TOTAL_GAME_TIME;
        poseNet?.removeListener("pose", getData);
        p5.background(51);
        p5.text(
          `Score: ${movementCount}`,
          VIDEO_WIDTH / 2 - 150,
          VIDEO_HEIGHT / 2
        );
        p5.noLoop();
        movementCount = 0;
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
      <p className="title">Boxing AI Trainer</p>
      <Sketch setup={setup} draw={draw} keyPressed={keyPressed} />
    </div>
  );
};

export default App;
