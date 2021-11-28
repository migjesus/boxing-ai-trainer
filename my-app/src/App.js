import ml5 from "ml5";
import Sketch from "react-p5";
import * as p5 from "react-p5";
import * as p5sound from "react-p5/node_modules/p5/lib/addons/p5.sound";
import annyang from "annyang";
import mostCommon from "array-most-common";
import { constants } from "./constants";
/* import jsonContent from "./cmtest.json"; */

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
  let intervalId;
  let testData = [];
  let bestScore = 0;
  let bell;

  /* 
  const handleSaveToPC = (jsonData) => {
    const fileData = JSON.stringify(jsonData);
    const blob = new Blob([fileData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "testData.json";
    link.href = url;
    link.click();
  }; */

  /*  const keyPressed = (event) => {
    if (event.key === "s") {
      //neuralNetwork.saveData();
      let jsonData = JSON.stringify(testData);
      handleSaveToPC(jsonData);
    } else {
      targetLabel = event.key;
      console.log(targetLabel);
      setTimeout(() => {
        console.log("collecting");
        state = COLLECTING;
        setTimeout(() => {
          console.log("not collecting");
          state = WAITING;
        }, 30000);
      }, 5000);
    }
  }; */

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
    bell = p5.loadSound("bell.mp3");
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
      model: "mini20/model.json",
      metadata: "mini20/model_meta.json",
      weights: "mini20/model.weights.bin",
    };
    neuralNetwork?.load(modelSpecs);
    /*    running = true;
    p5.loop();
    running = true; */
  };

  const createButtonGroup = (p5) => {
    const buttonGroup = p5.createDiv();
    buttonGroup.style("display", "flex");
    buttonGroup.style("direction", "row");
    buttonGroup.style("margin", "20px");
    const playButton = p5.createButton("Fight & Stop");
    const debugButton = p5.createButton("Draw & Erase");
    /*     const trainButton = p5.createButton("Train"); */
    playButton.parent(buttonGroup);
    debugButton.parent(buttonGroup);
    /*     trainButton.parent(buttonGroup); */
    playButton.mousePressed(() => onPlayButtonClick(p5));
    debugButton.mousePressed(() => (debugMode = !debugMode));
    /*     trainButton.mousePressed(() => onTrainButtonClick()); */
  };

  const onPlayButtonClick = () => {
    /*  if (!running) {
       video = p5.createCapture(VIDEO_SETTINGS);
      video.position(0, 0);
      video.hide();
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
        model: "mini20/model.json",
        metadata: "mini20/model_meta.json",
        weights: "mini20/model.weights.bin",
      };
      neuralNetwork?.load(modelSpecs);
      running = true;
      p5.loop();
      running = true;
      intervalId = setInterval(timeIt, 1000); 
    }  else {
      clearInterval(intervalId);
      running = false;
      timer = TOTAL_GAME_TIME;
       video.remove();
      poseNet?.removeListener("pose", getData);
      p5.background(51);
      p5.noLoop(); 
    } */
    console.log(intervalId);
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
      timer = TOTAL_GAME_TIME;
      movementCount > bestScore && (bestScore = movementCount);
      movementCount = 0;
      bell.play();
    } else {
      bell.play();
      intervalId = setInterval(timeIt, 1000);
    }
  };

  const timeIt = () => {
    if (timer > 0) {
      timer--;
    }
  };

  /*   const onTrainButtonClick = () => {
    let options = {
      inputs: 22,
      outputs: 4,
      task: "classification",
      debug: true,
    };
    neuralNetwork = ml5.neuralNetwork(options);
    neuralNetwork.loadData("mini.json", train);
  };
 */

  const classifyData = () => {
    if (pose && pose.keypoints /* && running && timer !== 0 */) {
      let inputs = [];
      for (let i = 0; i < 11; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      neuralNetwork.classify(inputs, getLabel);
    } /* else if (!running || timer === 0) {
      return;
    } */ else {
      /* setTimeout(classifyData, 100); */
      classifyData();
    }
    /* let file = JSON.parse(jsonContent);
    neuralNetwork.classifyMultiple(file, getLabel); */
  };

  const getLabel = (error, results) => {
    /*   console.log(results);
    let final = [];
    if (results) {
      for (let i = 0; i < results.length; i++) {
        let maxObjLabel = results[i].reduce((max, obj) =>
          max.confidence > obj.confidence ? max : obj
        );
        final.push(maxObjLabel.label);
      }
      let ct = 0;
      for (let i = 0; i < final.length; i++) {
        if (final[i] === "c") {
          ct++;
        }
      }
      console.log(final);
      console.log(ct);
    } */

    if (error) {
      console.log("error");
      return;
    }
    if (results !== undefined && results.lenght !== 0) {
      sequence.push(results[0].label);
    }
    if (sequence.length === 10) {
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
  };

  /*   const train = () => {
    neuralNetwork.normalizeData();
    neuralNetwork.train({ epochs: 100 }, saveModel);
  };
 */

  /*   const saveModel = () => {
    neuralNetwork.save();
  }; */

  const getData = (poses) => {
    if (poses.length === 0) {
      pose = {};
    } /* else if (!running) {
      console.log("entrei");
      return;
    } */ else {
      pose = poses[0].pose;
      skeleton = poses[0].skeleton;
      classifyData();
      if (state === COLLECTING) {
        let inputs = [];
        //mudar consoante modelo
        for (let i = 0; i < 11; i++) {
          let x = pose.keypoints[i].position.x;
          let y = pose.keypoints[i].position.y;
          inputs.push(x);
          inputs.push(y);
        }
        let target = [targetLabel];
        neuralNetwork.addData(inputs, target);
        testData.push(inputs);
      }
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
          `Best Score: ${bestScore}`,
          VIDEO_WIDTH / 2 - 310,
          VIDEO_HEIGHT / 2 - 170
        );
        p5.fill(255, 0, 255);
        p5.ellipse(VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2 - 20, 80, 80);
      }
      if (timer === 0) {
        /*   running = false; */
        /* clearInterval(intervalId);
        timer = TOTAL_GAME_TIME; */
        /*   poseNet?.removeListener("pose", getData);
        p5.background(51);
        p5.textSize(40);
        p5.text(
          `Score: ${movementCount}`,
          VIDEO_WIDTH / 2 - 150,
          VIDEO_HEIGHT / 2
        );
        p5.noLoop(); */
        /*  movementCount > bestScore && (bestScore = movementCount);
        movementCount = 0; */
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
      <p className="title">AI Boxing Trainer</p>~
      {/* falta adicionar keyPressed ao Sketch */}
      <Sketch setup={setup} draw={draw} />
    </div>
  );
};

export default App;
