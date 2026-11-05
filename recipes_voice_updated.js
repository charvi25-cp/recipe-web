
// =====================================
// VOICE COOKING ASSISTANT
// =====================================

let recipes = [];
let selectedRecipe = null;
let currentStep = 0;
let recognition = null;
let listening = false;
let timerInterval = null;
let secondsLeft = 0;

const statusText = document.getElementById("voice-status");
const stepTitle = document.getElementById("step-title");
const stepText = document.getElementById("recipe-step");
const timerDisplay = document.getElementById("timer-display");

// SPEAKING FUNCTION

function speak(message) {
    if (!("speechSynthesis" in window)) {
        statusText.textContent = "Speech not supported.";
        return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;

    speechSynthesis.speak(utterance);
}

// SELECT RECIPE

function selectRecipe(recipe) {
    selectedRecipe = recipe;
    currentStep = 0;

    stepTitle.textContent = recipe.name;
    stepText.textContent = "Recipe selected! Click Start Cooking.";
    statusText.textContent = recipe.name + " selected!";
}

// SHOW COOKING STEP

function showStep() {
    if (!selectedRecipe) return;

    const instruction = selectedRecipe.steps[currentStep];

    stepTitle.textContent = "Step " + (currentStep + 1);
    stepText.textContent = instruction;

    speak(instruction);
}

// NEXT STEP

function nextStep() {
    if (!selectedRecipe) return;

    if (currentStep < selectedRecipe.steps.length - 1) {
        currentStep++;
        showStep();
    } else {
        stepTitle.textContent = "Finished!";
        stepText.textContent = "You have completed this recipe!";
        speak("Congratulations! Your recipe is complete!");
    }
}

// STOP ASSISTANT

function stopAssistant() {
    listening = false;

    if (recognition) {
        try {
            recognition.onend = null;
            recognition.stop();
        } catch (error) {}
    }

    speechSynthesis.cancel();
    statusText.textContent = "Assistant stopped.";
}

// VOICE RECOGNITION

function startListening() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        statusText.textContent =
            "Voice commands unavailable. Use the buttons instead.";
        return;
    }

    if (listening) return;

    try {
        recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.continuous = true;

        recognition.onresult = function(event) {
            const command =
                event.results[event.results.length - 1][0]
                .transcript.toLowerCase();

            statusText.textContent = "You said: " + command;

            if (command.includes("next")) {
                nextStep();
            }

            else if (command.includes("repeat")) {
                if (selectedRecipe) {
                    speak(selectedRecipe.steps[currentStep]);
                }
            }

            else if (command.includes("stop")) {
                stopAssistant();
            }

            else {
                const match = command.match(
                    /(\d+)\s*(minutes?|mins?|seconds?|secs?)/
                );

                if (match) {
                    let time = Number(match[1]);

                    if (match[2].startsWith("min")) {
                        time *= 60;
                    }

                    startTimer(time);
                    speak("Timer started!");
                }
            }
        };

        recognition.onerror = function(event) {
            statusText.textContent =
                "Microphone issue: " + event.error;
        };

        recognition.onend = function() {
            if (listening) {
                try {
                    recognition.start();
                } catch (error) {}
            }
        };

        listening = true;
        recognition.start();

    } catch (error) {
        listening = false;
        statusText.textContent =
            "Allow microphone access to use voice commands.";
    }
}

// TIMER

function startTimer(seconds) {
    clearInterval(timerInterval);
    secondsLeft = seconds;

    function updateDisplay() {
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;

        timerDisplay.textContent =
            String(minutes).padStart(2, "0") + ":" +
            String(seconds).padStart(2, "0");
    }

    updateDisplay();

    timerInterval = setInterval(function() {
        secondsLeft--;

        if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            secondsLeft = 0;

            updateDisplay();
            speak("Your cooking timer is complete!");
            statusText.textContent = "Timer completed!";
        } else {
            updateDisplay();
        }
    }, 1000);
}

// STOP TIMER

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    secondsLeft = 0;
    timerDisplay.textContent = "00:00";
    statusText.textContent = "Timer stopped.";
}

// FIND RECIPES IN YOUR HTML

const recipeCards = document.querySelectorAll(
    "body > details > ul > details"
);

recipeCards.forEach(function(card) {
    const heading = card.querySelector("summary h4");
    const orderedList = card.querySelector("ol");

    if (!heading || !orderedList) return;

    const recipe = {
        name: heading.textContent.trim(),

        steps: Array.from(
            orderedList.querySelectorAll("li")
        ).map(function(item) {
            return item.textContent.trim();
        })
    };

    if (recipe.steps.length === 0) return;

    recipes.push(recipe);

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = "🎙️ Cook this recipe";

    button.onclick = function() {
        selectRecipe(recipe);

        document.getElementById("voice-assistant")
            .scrollIntoView({ behavior: "smooth" });
    };

    card.appendChild(button);
});

// SELECT FIRST RECIPE BY DEFAULT

if (recipes.length > 0) {
    selectRecipe(recipes[0]);
} else {
    statusText.textContent = "No recipes found!";
}

// BUTTON CONNECTIONS

document.getElementById("start-voice").onclick = function() {
    if (!selectedRecipe && recipes.length > 0) {
        selectRecipe(recipes[0]);
    }

    if (!selectedRecipe) {
        statusText.textContent = "No recipe found!";
        return;
    }

    currentStep = 0;
    showStep();
    startListening();
};

document.getElementById("next-step").onclick = nextStep;

document.getElementById("repeat-step").onclick = function() {
    if (selectedRecipe) {
        speak(selectedRecipe.steps[currentStep]);
    }
};

document.getElementById("stop-voice").onclick = stopAssistant;

document.getElementById("timer-button").onclick = function() {
    startTimer(60);
};

const stopButton = document.getElementById("timer-stop");

if (stopButton) {
    stopButton.onclick = stopTimer;
}
