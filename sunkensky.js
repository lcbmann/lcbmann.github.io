// Define a centralized costs object
const costs = {
    bucket: {
        baseWood: 10, // Base wood cost for the first bucket
        additionalCostPerBucket: 5, // Additional wood cost per subsequent bucket
    },
    rainBarrel: {
        wood: 30, // Fixed wood cost for rain barrel
        rope: 10, // Fixed rope cost for rain barrel
    },
    raft: {
        wood: 100, // Fixed wood cost for raft
        rope: 50,  // Fixed rope cost for raft
    }
};

// Game state variables
let gameState = {
    location: 'Below Deck',
    standAttempts: 0,
    locations: ['Below Deck', 'Above Deck'],
    discoveredLocations: ['Below Deck'], // Start with only 'Below Deck' discovered
    actionCooldowns: {}, // Store cooldowns for actions
    weather: 'windy', // Current weather
    storage: { wood: 0, rope: 0, food: 0, bucket: 0 }, // Initial storage amounts, including buckets
    maxStorage: 150, // Maximum storage capacity
    inventory: { wood: 0, rope: 0, food: 0 }, // Player's carry inventory
    baseMaxInventory: 10, // Base max items player can carry
    maxInventory: 10, // Current max inventory, increases with buckets
    scavengeAttempts: 0, // Number of times scavenged
    maxScavengeAttempts: 40, // Max scavenge attempts
    inventoryVisible: false, // Inventory visibility flag
    storageVisible: false, // Storage visibility flag
    stamina: 30, // Player's starting stamina (out of 50)
    maxStamina: 100, // Current max stamina, increases with water
    staminaVisible: false, // Stamina bar visibility flag
    bucketCrafted: 0, // Number of buckets crafted
    bucketOptionAvailable: false, // Flag to show bucket crafting option
    rainBarrelCrafted: false, // Flag for rain barrel
    firstScavengeTime: null, // Time when player first scavenged
    thirstInterval: null, // Interval for decreasing stamina over time
    lightningInterval: null, // Interval for lightning effect
};

const weatherOptions = ['windy', 'cloudy', 'rainy', 'stormy'];
let currentWeatherIndex = 0;

// Timed events
let headacheInterval;
let bucketHintTimeout;
let rainBarrelHintTimeout;

// Action definitions
const actions = {
    'Stand up': {
        cooldown: 5,
        execute: standUpAction,
    },
    'Climb the stairs': {
        cooldown: 0,
        execute: climbStairsAction,
    },
    'Assess the situation': {
        cooldown: 0,
        execute: assessSituationAction,
    },
    'Scavenge debris': {
        cooldown: 5,
        execute: scavengeDebrisAction,
    },
    'Deposit items into storage': {
        cooldown: 0,
        execute: depositItemsAction,
    },
    'Eat food': {
        cooldown: 0,
        execute: eatFoodAction,
    },
    'Craft bucket': {
        cooldown: 0,
        execute: craftBucketAction,
    },
    'Craft rain barrel': {
        cooldown: 0,
        execute: craftRainBarrelAction,
    },
    'Collect water': {
        cooldown: 60, // Collect water every 60 seconds
        execute: collectWaterAction,
    },
};

// Initialize the game
function startGame() {
    updateLocationDisplay();
    startWeatherCycle();
    updateStylesBasedOnWeather();
    scheduleHeadacheMessage();
    startStaminaRegeneration();
    startMaxStaminaDecay(); // Start the decay for max stamina
    setTimeout(() => addMessage('Your head is pounding.', true), 2000);
    setTimeout(() => addMessage('The ship creaks.'), 6000);

    setTimeout(() => addActionButton('Stand up'), 8000);
}


// Function to update the location display
// Function to update the location display
function updateLocationDisplay() {
    const locationElement = document.getElementById('location');
    locationElement.innerHTML = ''; // Clear previous content

    gameState.discoveredLocations.forEach((loc) => {
        const locElement = document.createElement('span');
        locElement.textContent = loc;
        locElement.className = 'location-name';
        if (loc === gameState.location) {
            locElement.classList.add('current-location');
        }
        locElement.onclick = () => switchLocation(loc);
        locationElement.appendChild(locElement);
    });

    // Trigger fade-in effect after appending the content
    requestAnimationFrame(() => {
        locationElement.classList.add('visible'); // Apply visible class for fade-in
    });
}

// Function to update styles based on weather
function updateStylesBasedOnWeather() {
    const root = document.documentElement;

    // Set a timeout to delay the update of CSS variables
    setTimeout(() => {
        if (gameState.location === 'Above Deck') {
            // Apply styles based on the current weather
            if (gameState.weather === 'windy') {
                root.style.setProperty('--background-color', '#f5f5f5'); // Very light gray
                root.style.setProperty('--text-color', '#000000'); // Black text
                root.style.setProperty('--button-text-color', '#000000');
                root.style.setProperty('--button-border-color', '#000000');
                root.style.setProperty('--box-border-color', '#000000');
                stopLightningEffect(); // Ensure lightning effect is stopped
            } else if (gameState.weather === 'cloudy') {
                root.style.setProperty('--background-color', '#dcdcdc'); // Gainsboro
                root.style.setProperty('--text-color', '#000000'); // Black text
                root.style.setProperty('--button-text-color', '#000000');
                root.style.setProperty('--button-border-color', '#000000');
                root.style.setProperty('--box-border-color', '#000000');
                stopLightningEffect();
            } else if (gameState.weather === 'rainy') {
                root.style.setProperty('--background-color', '#a9a9a9'); // Dark gray
                root.style.setProperty('--text-color', '#ffffff'); // White text
                root.style.setProperty('--button-text-color', '#ffffff');
                root.style.setProperty('--button-border-color', '#ffffff');
                root.style.setProperty('--box-border-color', '#ffffff');
                stopLightningEffect();
            } else if (gameState.weather === 'stormy') {
                root.style.setProperty('--background-color', '#1a1a1a'); // Darker gray
                root.style.setProperty('--text-color', '#ffffff'); // White text
                root.style.setProperty('--button-text-color', '#ffffff');
                root.style.setProperty('--button-border-color', '#ffffff');
                root.style.setProperty('--box-border-color', '#ffffff');
                startLightningEffect();
            }
        } else {
            // Styles for Below Deck
            root.style.setProperty('--background-color', '#000000'); // Black background
            root.style.setProperty('--text-color', '#ffffff'); // White text
            root.style.setProperty('--button-text-color', '#ffffff');
            root.style.setProperty('--button-border-color', '#ffffff');
            root.style.setProperty('--box-border-color', '#ffffff');
            stopLightningEffect(); // Stop lightning when below deck
        }
    }, 50); // Delay to prevent interrupting transitions
}

// Function to start the weather cycle
function startWeatherCycle() {
    setInterval(() => {
        currentWeatherIndex = (currentWeatherIndex + 1) % weatherOptions.length;
        gameState.weather = weatherOptions[currentWeatherIndex];

        if (gameState.location === 'Above Deck') {
            updateStylesBasedOnWeather();
            displayWeatherMessage();
        }
    }, 180000); // Change every 3 minutes
}

// Function to display weather messages
function displayWeatherMessage() {
    if (gameState.weather === 'windy') {
        addMessage('Thin clouds line the sky. The wind blows relentlessly.');
    } else if (gameState.weather === 'cloudy') {
        addMessage('Gray clouds cover the sky.');
    } else if (gameState.weather === 'rainy') {
        addMessage('Rain pours down relentlessly.');
    } else if (gameState.weather === 'stormy') {
        addMessage('A fierce storm rages around you.');
    }
}

// Function to start lightning effect during stormy weather
function startLightningEffect() {
    const body = document.body;

    // Clear any existing intervals
    if (gameState.lightningInterval) {
        clearInterval(gameState.lightningInterval);
    }

    gameState.lightningInterval = setInterval(() => {
        // Flash the background color to white briefly
        body.style.backgroundColor = '#ffffff';

        setTimeout(() => {
            body.style.backgroundColor = '#1a1a1a'; // Back to dark gray
        }, 100); // Flash duration
    }, Math.random() * 5000 + 2000); // Random interval between 2-7 seconds
}

// Function to stop lightning effect
function stopLightningEffect() {
    if (gameState.lightningInterval) {
        clearInterval(gameState.lightningInterval);
        gameState.lightningInterval = null;
        updateStylesBasedOnWeather(); // Reset background color
    }
}

// Function to add a message to the message list
function addMessage(text, isBold = false) {
    const messagesContainer = document.getElementById('messages');

    // Create the new message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = text;
    messageElement.style.opacity = 0; // Start with opacity 0

    // Apply bold style if isBold is true
    if (isBold) {
        messageElement.style.fontWeight = 'bold';
    }

    // Insert the new message at the top
    messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);

    // Force reflow to register the initial opacity
    getComputedStyle(messageElement).opacity;

    // Trigger the fade-in effect
    messageElement.style.opacity = 1;

    // Wait for the message to render to get its height
    requestAnimationFrame(() => {
        const newMessageHeight = messageElement.offsetHeight + 10; // Include margin-bottom

        // Move existing messages down
        const messages = Array.from(messagesContainer.children);
        messages.forEach((msg) => {
            if (msg !== messageElement) {
                const currentTop = parseFloat(msg.style.top) || 0;
                msg.style.top = currentTop + newMessageHeight + 'px';
            }
        });

        // Remove messages that have moved beyond the bottom
        const containerHeight = document.getElementById('game-area').clientHeight;
        messages.forEach((msg) => {
            const msgTop = parseFloat(msg.style.top) || 0;
            if (msgTop >= containerHeight) {
                messagesContainer.removeChild(msg);
            }
        });

        // Ensure the new message is at the top
        messageElement.style.top = '0px';
    });
}


function addActionButton(actionName) {
    const action = actions[actionName];
    if (!action) return;

    const actionsContainer = document.getElementById('actions');
    const existingButton = Array.from(actionsContainer.children).find(
        (btnContainer) => btnContainer.getAttribute('data-action') === actionName
    );
    if (existingButton) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'action-button-container';
    buttonContainer.setAttribute('data-action', actionName);

    const button = document.createElement('button');
    button.textContent = actionName;

    const cooldownOverlay = document.createElement('div');
    cooldownOverlay.className = 'cooldown-overlay';
    cooldownOverlay.style.width = '0%';
    button.appendChild(cooldownOverlay);

    // Handle cost display if needed
    const costElement = document.createElement('div');
    costElement.className = 'cost';

    if (actionName === 'Craft bucket') {
        const currentBucketCost = costs.bucket.baseWood + (gameState.bucketCrafted * costs.bucket.additionalCostPerBucket);
        costElement.textContent = `Cost: ${currentBucketCost} wood`;
    } else if (actionName === 'Craft rain barrel') {
        costElement.textContent = `Cost: ${costs.rainBarrel.wood} wood, ${costs.rainBarrel.rope} rope`;
    } else if (actionName === 'Craft raft') {
        costElement.textContent = `Cost: ${costs.raft.wood} wood, ${costs.raft.rope} rope`;
    }
    
    buttonContainer.appendChild(button);
    if (costElement.textContent) {
        buttonContainer.appendChild(costElement);
    }

    actionsContainer.appendChild(buttonContainer);

    setTimeout(() => {
        buttonContainer.classList.add('visible');
    }, 50);

    button.onclick = () => {
        const lastUsed = gameState.actionCooldowns[actionName];
        const now = Date.now();
        if (lastUsed && now - lastUsed < action.cooldown * 1000) {
            return;
        }

        if (action.cooldown > 0) {
            gameState.actionCooldowns[actionName] = now;
            startCooldown(button, action.cooldown);
        }

        action.execute();
        if (actionName === 'Assess the situation') {
            buttonContainer.remove();
        }
    };

    // Re-apply cooldown if it exists
    const lastUsed = gameState.actionCooldowns[actionName];
    if (lastUsed) {
        const now = Date.now();
        if (now - lastUsed < action.cooldown * 1000) {
            startCooldown(button, action.cooldown);
        }
    }

    // Update costs dynamically if necessary
    updateActionButtonCosts();
}



function updateActionButtonCosts() {
    const bucketButton = document.querySelector('[data-action="Craft bucket"] .cost');
    if (bucketButton) {
        const currentBucketCost = costs.bucket.baseWood + (gameState.bucketCrafted * costs.bucket.additionalCostPerBucket);
        bucketButton.textContent = `Cost: ${currentBucketCost} wood`;
    }

    const rainBarrelButton = document.querySelector('[data-action="Craft rain barrel"] .cost');
    if (rainBarrelButton) {
        rainBarrelButton.textContent = `Cost: ${costs.rainBarrel.wood} wood, ${costs.rainBarrel.rope} rope`;
    }
}




// Function to handle button cooldown visualization
function startCooldown(button, cooldownSeconds) {
    button.disabled = true;

    const cooldownOverlay = button.querySelector('.cooldown-overlay');
    const now = Date.now();
    const timeRemaining = Math.max(0, cooldownSeconds - Math.floor((now - gameState.actionCooldowns[button.textContent]) / 1000));

    if (cooldownOverlay) {
        cooldownOverlay.style.transition = 'none';
        cooldownOverlay.style.width = '100%';
        cooldownOverlay.style.opacity = 1;

        cooldownOverlay.offsetWidth;

        cooldownOverlay.style.transition = `width ${timeRemaining}s linear`;
        cooldownOverlay.style.width = '0%';

        cooldownOverlay.addEventListener('transitionend', function handler() {
            button.disabled = false;
            cooldownOverlay.style.opacity = 0;
            cooldownOverlay.style.width = '0%';
            cooldownOverlay.style.transition = '';
            cooldownOverlay.removeEventListener('transitionend', handler);
        });
    }

    setTimeout(() => {
        button.disabled = false;
    }, timeRemaining * 1000);
}


// Function to clear all action buttons
function clearActionButtons() {
    const actionsContainer = document.getElementById('actions');
    actionsContainer.innerHTML = '';
}

// Schedule the "Your head is throbbing" message every few minutes
function scheduleHeadacheMessage() {
    if (headacheInterval) clearInterval(headacheInterval);
    headacheInterval = setInterval(() => {
        addMessage('Your head is throbbing.');
    }, 180000); // Every 3 minutes
}

// Function to start stamina regeneration
function startStaminaRegeneration() {
    setInterval(() => {
        if (gameState.stamina < gameState.maxStamina) {
            changeStamina(1); 
        }
    }, 30000); // Every 10 seconds
}

// Action implementations
function standUpAction() {
    gameState.standAttempts += 1;

    if (gameState.standAttempts === 1) {
        addMessage('You try to stand, but collapse back onto the floor.');
    } else if (gameState.standAttempts === 2) {
        addMessage("You struggle to your knees. The world spins.");
    } else if (gameState.standAttempts >= 3) {
        addMessage('You stand, wobble, and steady yourself.');
        setTimeout(() => addMessage('You see a staircase leading up into the light.'), 2000);
        clearActionButtons();
        setTimeout(() => addActionButton('Climb the stairs'), 2000);
    }
}

function climbStairsAction() {
    addMessage('You slowly make your way up the stairs.');
    gameState.location = 'Above Deck';

    // Add 'Above Deck' to discovered locations if not already present
    if (!gameState.discoveredLocations.includes('Above Deck')) {
        gameState.discoveredLocations.push('Above Deck');
    }

    updateLocationDisplay();
    updateStylesBasedOnWeather();
    displayWeatherMessage();
    clearActionButtons();

    // Add "Assess the situation" action
    setTimeout(() => addActionButton('Assess the situation'), 2000);
}

function assessSituationAction() {
    setTimeout(() => addMessage('Debris covers the deck in every direction.'), 1000);
    setTimeout(() => addMessage('The mast is in pieces. The sails are torn.'), 3000);
    setTimeout(
        () =>
            addMessage(
                'The world is shrouded in cloud. The sea stretches forever in all directions.'
            ),
        5000
    );

    // After assessing, set inventory and storage to visible
    setTimeout(() => {
        gameState.inventoryVisible = true;
        gameState.storageVisible = true;
        gameState.staminaVisible = true;
        updateInventoryDisplay();
        updateStorageDisplay();
        updateStaminaBar();

        // After assessing, add "Scavenge debris" action
        addActionButton('Scavenge debris');
        addActionButton('Eat food');
    }, 8000);
}

function scavengeDebrisAction() {
    if (gameState.scavengeAttempts >= gameState.maxScavengeAttempts) {
        addMessage('The deck is now clean. There is no more debris to scavenge.', true);
        addMessage('There is more debris floating in the sea surrounding the ship. You will need to craft a raft to reach it.', true);
        addActionButton('Craft raft');
        return;
    }

    // Check if the player has enough stamina
    if (gameState.stamina < 10) {
        addMessage('You are too exhausted to scavenge. You need to eat food or rest.');
        return;
    }

    // Decrease stamina
    changeStamina(-10); // Directly subtract 10 stamina here

    // Record first scavenge time, and set up bucket hint if not already set
    if (!gameState.firstScavengeTime) {
        gameState.firstScavengeTime = Date.now();
        
        // Schedule bucket hint after 1 minute of scavenging
        bucketHintTimeout = setTimeout(() => {
            addMessage('A bucket could be useful. It would help you carry more items.', true);
            gameState.bucketOptionAvailable = true;
            if (gameState.location === 'Below Deck') {
                addActionButton('Craft bucket');
            }
        }, 60000); // After 1 minute (60,000ms)
    }

    gameState.scavengeAttempts += 1;

    // Random amounts between 1 and 3
    const woodFound = Math.floor(Math.random() * 3) + 1;
    const ropeFound = Math.floor(Math.random() * 3) + 1;
    const foodFound = Math.floor(Math.random() * 3) + 1;

    const totalInventory = getTotalItems(gameState.inventory);
    const spaceLeft = gameState.maxInventory - totalInventory;

    // Adjust items to fit inventory space
    const proportions = distributeItems([woodFound, ropeFound, foodFound], spaceLeft);
    const collectedWood = proportions[0];
    const collectedRope = proportions[1];
    const collectedFood = proportions[2];

    gameState.inventory.wood += collectedWood;
    gameState.inventory.rope += collectedRope;
    gameState.inventory.food += collectedFood;

    addMessage(`You scavenge some debris and find ${collectedWood} wood, ${collectedRope} rope, and ${collectedFood} food.`);
    updateInventoryDisplay();

    if (gameState.scavengeAttempts >= gameState.maxScavengeAttempts) {
        addMessage('The deck is now clean.', true);
        addMessage('There is more debris floating in the sea surrounding the ship. You will need to craft a raft to reach it.', true);
        addActionButton('Craft raft');
    }
}




function depositItemsAction() {
    // Check if inventory is empty
    const totalInventory = getTotalItems(gameState.inventory);
    if (totalInventory === 0) {
        addMessage('You have nothing to deposit.');
        return;
    }

    // Calculate total items in storage
    const totalStorage = getTotalItems(gameState.storage);
    const storageSpaceLeft = gameState.maxStorage - totalStorage;

    if (storageSpaceLeft <= 0) {
        addMessage('Your storage is full. You cannot deposit more items.');
        return;
    }

    // Adjust amounts if storage limit is exceeded
    if (totalInventory > storageSpaceLeft) {
        const scale = storageSpaceLeft / totalInventory;
        gameState.storage.wood += Math.floor(gameState.inventory.wood * scale);
        gameState.storage.rope += Math.floor(gameState.inventory.rope * scale);
        gameState.storage.food += Math.floor(gameState.inventory.food * scale);
        // Reduce inventory accordingly
        gameState.inventory.wood -= Math.floor(gameState.inventory.wood * scale);
        gameState.inventory.rope -= Math.floor(gameState.inventory.rope * scale);
        gameState.inventory.food -= Math.floor(gameState.inventory.food * scale);
        addMessage('Your storage is full. You could only deposit some items.');
    } else {
        // Move all items from inventory to storage
        gameState.storage.wood += gameState.inventory.wood;
        gameState.storage.rope += gameState.inventory.rope;
        gameState.storage.food += gameState.inventory.food;
        gameState.inventory.wood = 0;
        gameState.inventory.rope = 0;
        gameState.inventory.food = 0;
        addMessage('You deposit your items into storage.');
    }

    updateInventoryDisplay();
    updateStorageDisplay();
}

function eatFoodAction() {
    // Check if stamina is at maximum
    if (gameState.stamina >= gameState.maxStamina) {
        addMessage("You're already at full stamina.");
        return;
    }

    // Check for food availability
    let foodSource = '';

    if (gameState.inventory.food > 0) {
        foodSource = 'inventory';
        gameState.inventory.food -= 1;
    } else if (gameState.storage.food > 0) {
        foodSource = 'storage';
        gameState.storage.food -= 1;
    } else {
        addMessage('You have no food to eat.');
        return;
    }

    // Restore stamina, but not exceeding maxStamina
    const staminaGain = Math.min(
        Math.floor(gameState.maxStamina / 3),
        gameState.maxStamina - gameState.stamina
    );
    changeStamina(staminaGain);

    addMessage(`You eat some food from your ${foodSource}.`);
    updateInventoryDisplay();
    updateStorageDisplay();
}

// Crafting actions implementations
function craftBucketAction() {
    const currentBucketCost = costs.bucket.baseWood + (gameState.bucketCrafted * costs.bucket.additionalCostPerBucket);

    if (gameState.bucketCrafted >= 5) {
        addMessage('You cannot carry any more buckets.');
        return;
    }

    if (gameState.storage.wood >= currentBucketCost) {
        gameState.storage.wood -= currentBucketCost;
        gameState.storage.bucket += 1;
        gameState.bucketCrafted += 1;
        gameState.maxInventory += 5; // Increase inventory size
        addMessage(
            `You craft a bucket using ${currentBucketCost} wood. You can now carry more items (${gameState.bucketCrafted}/5 buckets crafted).`
        );
        updateInventoryDisplay();
        updateStorageDisplay();
        updateActionButtonCosts(); // Update cost after crafting
        
        // Check if the player can now craft a rain barrel
        if (gameState.bucketCrafted >= 1 && !gameState.rainBarrelCrafted) {
            setTimeout(() => addMessage('With enough wood and rope, you could craft a rain barrel to gather water.', true), 2000);
            addActionButton('Craft rain barrel');
        }

        if (gameState.bucketCrafted >= 5) {
            const actionsContainer = document.getElementById('actions');
            const craftButtonContainer = actionsContainer.querySelector('[data-action="Craft bucket"]');
            if (craftButtonContainer) {
                craftButtonContainer.remove();
            }
        }
    } else {
        addMessage(`You don't have enough wood to craft a bucket. You need ${currentBucketCost} wood.`);
    }
    updateStorageDisplay();
}


function craftRainBarrelAction() {
    const requiredWood = costs.rainBarrel.wood;
    const requiredRope = costs.rainBarrel.rope;

    if (gameState.storage.wood >= requiredWood && gameState.storage.rope >= requiredRope) {
        gameState.storage.wood -= requiredWood;
        gameState.storage.rope -= requiredRope;
        gameState.rainBarrelCrafted = true;
        addMessage(`You craft a rain barrel using ${requiredWood} wood and ${requiredRope} rope.`);
        updateStorageDisplay();

        // Remove the craft rain barrel action
        const actionsContainer = document.getElementById('actions');
        const craftButtonContainer = actionsContainer.querySelector('[data-action="Craft rain barrel"]');
        if (craftButtonContainer) {
            craftButtonContainer.remove();
        }

        // Add "Collect water" action when above deck
        if (gameState.location === 'Above Deck') {
            addActionButton('Collect water');
        }
    } else {
        addMessage("You don't have enough materials to craft a rain barrel.");
    }
    updateStorageDisplay();
}

function craftRaftAction() {
    const requiredWood = costs.raft.wood;
    const requiredRope = costs.raft.rope;

    if (gameState.storage.wood >= requiredWood && gameState.storage.rope >= requiredRope) {
        gameState.storage.wood -= requiredWood;
        gameState.storage.rope -= requiredRope;
        addMessage(`You craft a sturdy raft using ${requiredWood} wood and ${requiredRope} rope. You can now scavenge the sea for more debris.`, true);
        updateStorageDisplay();

        // After crafting the raft, you can add actions to scavenge at sea
        addActionButton('Scavenge at sea');
    } else {
        addMessage("You don't have enough materials to craft a raft.");
    }
}


function collectWaterAction() {
    if (gameState.maxStamina >= 150) {
        addMessage("Your stamina is at its maximum capacity. You don't need more water right now.");
        return;
    }
    
    addMessage('You collect fresh water from the rain barrel.');
    gameState.maxStamina += 10; // Increase max stamina by 10 each time
    if (gameState.maxStamina > 150) gameState.maxStamina = 150; // Cap the max stamina at 150
    updateStaminaBar();
}



// Function to update the inventory display
function updateInventoryDisplay() {
    const inventoryElement = document.getElementById('inventory');
    const totalInventory = getTotalItems(gameState.inventory);

    if (gameState.inventoryVisible) {
        inventoryElement.innerHTML = `
            <div class="box">
                <p><strong>Inventory (${totalInventory}/${gameState.maxInventory}):</strong></p>
                <p>Wood: ${gameState.inventory.wood}</p>
                <p>Rope: ${gameState.inventory.rope}</p>
                <p>Food: ${gameState.inventory.food}</p>
            </div>
        `;

        // Add 'visible' class to trigger fade-in
        requestAnimationFrame(() => {
            inventoryElement.classList.add('visible');
        });
    } else {
        inventoryElement.classList.remove('visible');
    }
}

// Function to update the storage display
function updateStorageDisplay() {
    const storageElement = document.getElementById('storage');
    const totalStorage = getTotalItems(gameState.storage);

    if (gameState.storageVisible && gameState.location === 'Below Deck') {
        let storageContent = `
            <div class="box">
                <p><strong>Storage (${totalStorage}/${gameState.maxStorage}):</strong></p>
                <p>Wood: ${gameState.storage.wood}</p>
                <p>Rope: ${gameState.storage.rope}</p>
                <p>Food: ${gameState.storage.food}</p>
        `;

        if (gameState.storage.bucket > 0) {
            storageContent += `<p>Buckets: ${gameState.storage.bucket}</p>`;
        }

        storageContent += '</div>';
        storageElement.innerHTML = storageContent;

        // Add 'visible' class to trigger fade-in
        requestAnimationFrame(() => {
            storageElement.classList.add('visible');
        });
    } else {
        storageElement.classList.remove('visible');
    }
}

// Function to update the stamina bar
function updateStaminaBar() {
    const staminaElement = document.getElementById('stamina-bar');
    if (gameState.staminaVisible) {
        const staminaPercent = Math.max(
            0,
            Math.min(100, (gameState.stamina / gameState.maxStamina) * 100)
        );
        staminaElement.innerHTML = `
            <div class="stamina-container">
                <div class="stamina-fill" style="width: ${staminaPercent}%"></div>
            </div>
            <p>Stamina: ${Math.floor(gameState.stamina)}/${gameState.maxStamina}</p>
        `;

        // Add 'visible' class to trigger fade-in
        requestAnimationFrame(() => {
            staminaElement.classList.add('visible');
        });
    } else {
        staminaElement.classList.remove('visible');
    }
}

// Function to change stamina and check for depletion
function changeStamina(amount) {
    gameState.stamina += amount;
    if (gameState.stamina > gameState.maxStamina) {
        gameState.stamina = gameState.maxStamina;
    }
    if (gameState.stamina < 0) {
        gameState.stamina = 0; // Stamina can go down to 0
    }
    updateStaminaBar();
}


function startMaxStaminaDecay() {
    setInterval(() => {
        if (gameState.maxStamina > 50) {
            gameState.maxStamina -= 5; // Decrease max stamina by 5 every interval
            setTimeout(() => addMessage('The thirst weakens you. Not as much energy now.'), 1000);
            if (gameState.maxStamina < 50) gameState.maxStamina = 50; // Ensure it doesn’t go below 50
            updateStaminaBar();
        }
    }, 60000); // Decrease every 1 minutes
}


// Utility function to get total items
function getTotalItems(obj) {
    return Object.keys(obj).reduce((total, key) => {
        if (key !== 'bucket') {
            return total + obj[key];
        }
        return total;
    }, 0);
}

// Utility function to distribute items proportionally
function distributeItems(items, spaceLeft) {
    let distributed = new Array(items.length).fill(0);

    if (spaceLeft <= 0) {
        return distributed;
    }

    // First, assign at least one item to each type if possible
    for (let i = 0; i < items.length && spaceLeft > 0; i++) {
        if (items[i] > 0) {
            distributed[i] = 1;
            spaceLeft--;
        }
    }

    // If there's remaining space, distribute proportionally
    const total = items.reduce((a, b) => a + b, 0);
    if (total > 0 && spaceLeft > 0) {
        for (let i = 0; i < items.length && spaceLeft > 0; i++) {
            let amount = Math.min(
                items[i] - distributed[i],
                Math.floor((items[i] / total) * spaceLeft)
            );
            distributed[i] += amount;
            spaceLeft -= amount;
        }
    }

    // Distribute any leftover space
    for (let i = 0; i < items.length && spaceLeft > 0; i++) {
        if (items[i] > distributed[i]) {
            distributed[i]++;
            spaceLeft--;
        }
    }

    return distributed;
}

// Switch location when location name is clicked
function switchLocation(targetLocation) {
    if (gameState.location !== targetLocation) {
        gameState.location = targetLocation;
        updateLocationDisplay();
        updateStylesBasedOnWeather();

        // Update messages for switching locations
        if (gameState.location === 'Above Deck') {
            addMessage('You ascend to the deck.');
            setTimeout(() => displayWeatherMessage(), 2000);
        } else {
            addMessage('You descend to the lower deck.');
        }

        clearActionButtons();

        updateInventoryDisplay();
        updateStorageDisplay();

        // Add actions based on the new location
        if (gameState.location === 'Above Deck') {
            // Add actions for Above Deck
            if (gameState.inventoryVisible) {
                if (gameState.scavengeAttempts < gameState.maxScavengeAttempts) {
                    addActionButton('Scavenge debris');
                }
                addActionButton('Eat food');
            }
            if (gameState.rainBarrelCrafted) {
                addActionButton('Collect water');
            }
        } else if (gameState.location === 'Below Deck') {
            // Add actions for Below Deck
            if (gameState.storageVisible) {
                if (getTotalItems(gameState.inventory) > 0) {
                    addActionButton('Deposit items into storage');
                }
                if (gameState.bucketOptionAvailable && gameState.bucketCrafted < 5) {
                    addActionButton('Craft bucket');
                }
                if (!gameState.rainBarrelCrafted && gameState.bucketCrafted > 0) {
                    addActionButton('Craft rain barrel');
                }
                addActionButton('Eat food');
            }
            if (gameState.standAttempts >= 3 && !gameState.inventoryVisible) {
                // Player can still climb back up if inventory is not yet visible
                addActionButton('Climb the stairs');
            }
        }
    }
}

// Start the game when the page loads
window.onload = startGame;