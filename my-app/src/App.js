import "./App.css";
import ml5 from "ml5";
import Sketch from "react-p5";
import mostCommon from "array-most-common";

const App = () => {
  let video;
  let poseNet;
  let pose;
  let skeleton;
  const videoConstraints = {
    video: {
      audio: false,
      height: 240,
      width: 320,
    },
  };
  let neurons;
  let state = "waiting";
  let targetLabel;
  let sequence = [];
  let randomPose = "e";
  let possiblePoses = ["a", "b"];
  let cool = false;
  let running = false;
  const totalGameTime = 30;
  let timer = totalGameTime;
  let movementCount = 0;
  let debugMode = false;

  const keyPressed = (event) => {
    if (event.key === "s") {
      neurons.saveData();
    } else {
      targetLabel = event.key;
      console.log(targetLabel);
      setTimeout(() => {
        console.log("collecting");
        state = "collecting";
        setTimeout(() => {
          console.log("not collecting");
          state = "waiting";
        }, 60000);
      }, 10000);
    }
  };

  const setup = (p5) => {
    p5.createCanvas(320, 240);
    p5.background(51);
    video = p5.createCapture(videoConstraints);
    video.position(0, 0);
    video.hide();
    const playButton = p5.createButton("Play/ Reset");
    const debugButton = p5.createButton("Debug Mode");
    const trainButton = p5.createButton("Train");
    playButton.mousePressed(() => {
      if (!running) {
        poseNet = ml5.poseNet(video, modelLoaded);
        poseNet.on("pose", gotPoses);
        let options = {
          inputs: 34,
          outputs: 5,
          task: "classification",
          debug: true,
        };
        neurons = ml5.neuralNetwork(options);
        const modelSpecs = {
          model: "model4/model.json",
          metadata: "model4/model_meta.json",
          weights: "model4/model.weights.bin",
        };
        neurons.load(modelSpecs, neuronsLoaded);
        running = true;
        p5.loop();
      } else {
        running = false;
        timer = totalGameTime;
        p5.background(51);
        if (poseNet) poseNet.removeListener("pose", gotPoses);
      }
    });
    debugButton.mousePressed(() => (debugMode = !debugMode));
    trainButton.mousePressed(() => {
      let options = {
        inputs: 34,
        outputs: 5,
        task: "classification",
        debug: true,
      };
      neurons = ml5.neuralNetwork(options);
      neurons.loadData("last.json", dataReady);
    });
  };

  const neuronsLoaded = () => {
    console.log("neurons ready");

    classifyPose();
  };

  const classifyPose = () => {
    if (pose && pose.keypoints && running && timer !== 0) {
      let inputs = [];
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      neurons.classify(inputs, gotResult);
    } else if (!running || timer === 0) {
      return;
    } else {
      setTimeout(classifyPose, 100);
    }
  };

  const gotResult = (results) => {
    if (results !== undefined && results.lenght !== 0) {
      sequence.push(results[0].label);
    }
    if (sequence.length === 20) {
      if (mostCommon(sequence) === randomPose) {
        cool = true; // turn poseLabel green
        movementCount++;
        randomPose =
          possiblePoses[Math.floor(Math.random() * possiblePoses.length)];
      }
      sequence = [];
    }
    classifyPose();
  };

  const dataReady = () => {
    neurons.normalizeData();
    neurons.train({ epochs: 100 }, finished);
  };

  const finished = () => {
    console.log("model finished training");
    neurons.save();
  };

  const gotPoses = (poses) => {
    if (poses.length === 0) {
      pose = {};
    }
    if (poses.length > 0) {
      pose = poses[0].pose;
      skeleton = poses[0].skeleton;
      if (state === "collecting") {
        let inputs = [];
        for (let i = 0; i < pose.keypoints.length; i++) {
          let x = pose.keypoints[i].position.x;
          let y = pose.keypoints[i].position.y;
          inputs.push(x);
          inputs.push(y);
        }
        let target = [targetLabel];
        neurons.addData(inputs, target);
      }
    }
  };

  const modelLoaded = () => {
    console.log("poseNet ready");
  };

  const debugPose = (p5, keypoints) => {
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

  const draw = (p5) => {
    if (running) {
      p5.push();
      p5.translate(video.width, 0);
      p5.scale(-1, 1);
      p5.image(video, 0, 0, 320, 240);

      if (pose !== undefined && pose.keypoints) {
        if (debugMode) {
          debugPose(p5, pose.keypoints);
        }
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
        p5.text(randomPose, video.width / 2 + 100, video.height / 2 - 60);
        p5.textSize(40);
        p5.text(timer, video.width / 2 + 105, video.height / 2 - 20);
        p5.ellipse(video.width / 2, video.height / 2 - 30, 40, 40);
        if (p5.frameCount % 60 === 0 && timer > 0) {
          timer--;
        }
      }
      if (!running || timer === 0) {
        running = false;
        timer = totalGameTime;
        if (poseNet) {
          poseNet.removeListener("pose", gotPoses);
        }
        p5.background(51);
        p5.text(movementCount, video.width / 2 + 100, video.height / 2 - 60);
        p5.noLoop();
      }
    }
  };

  return (
    <div>
      <p
        style={{
          fontWeight: "bold",
          fontSize: "40px",
          fontFamily: "fantasy",
          color: "#E6EFF3",
        }}
      >
        Boxing AI Trainer
      </p>
      <Sketch setup={setup} draw={draw} keyPressed={keyPressed} />
    </div>
  );
};

export default App;
