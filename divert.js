function startDivertGame(){
    var availablePower = 50;
    var enginePower = 0;
    var weaponPower = 0;
    var shieldPower = 0;
    var shieldHealth = 100;
    var hullHealth = 100;

    const availablePowerElement = document.getElementById('availablePower');
    const enginePowerElement = document.getElementById('enginePower');
    const weaponPowerElement = document.getElementById('weaponPower');
    const shieldPowerElement = document.getElementById('shieldPower');
    const shieldHealthElement = document.getElementById('shieldHealth');
    const hullHealthElement = document.getElementById('hullHealth')

    const increaseEngineButton = document.getElementById('increaseEngine');
    const increaseWeaponButton = document.getElementById('increaseWeapon');
    const increaseShieldButton = document.getElementById('increaseShield');
    const decreaseEngineButton = document.getElementById('decreaseEngine');
    const decreaseWeaponButton = document.getElementById('decreaseWeapon');
    const decreaseShieldButton = document.getElementById('decreaseShield');

    increaseEngineButton.onclick = increase(enginePower, 1);
    increaseWeaponButton.onclick = increase(weaponPower, 1);
    increaseShieldButton.onclick = increase(shieldPower, 1);

    decreaseEngineButton.onclick = decrease(enginePower, 1);
    decreaseWeaponButton.onclick = decrease(weaponPower, 1);
    decreaseShieldButton.onclick = decrease(shieldPower, 1);
}


function increase(increasingMeter, amount){
    var maxPower; 
    if(increasingMeter == availablePower){
        maxPower = 50;
    }
    else if(increasingMeter == (enginePower || weaponPower || shieldPower)){
        maxPower = 10;
    }
    else if(increasingMeter == (shieldHealth || hullHealth)){
        maxPower = 100;
    }

    if(increasingMeter < maxPower && (increasingMeter + amount) < maxPower){
        increasingMeter = increasingMeter + amount;
        updateMeter(increasingMeter);
    }
}

function decrease(decreasingMeter, amount){
    if(decreasingMeter > 0 && (decreasingMeter - amount) > 0){
        decreasingMeter = decreasingMeter - amount;
        updateMeter(decreasingMeter);
    }
}

function updateMeter(meter){
    var updatingElement;
    if(meter == availablePower){
        updatingElement = availablePowerElement;
    }
    else if(meter == enginePower){
        updatingElement = enginePowerElement;
    }
    else if(meter == weaponPower){
        updatingElement = weaponPowerElement;
    }
    else if(meter == shieldPower){
        updatingElement = shieldPowerElement;
    }
    else if(meter == shieldHealth){
        updatingelement = shieldHealthElement;
    }
    else if(meter == hullHealth){
        updatingElement = hullHealthElement;
    }

    if(meter > updatingElement.textContent.length){
        while(meter > updatingElement.textContent.length){
            updatingElement.textContent = updatingElement.textContent + "▓";
        }
    }
    else if (meter < updatingElement.textContent.length){
        while(meter < updatingElement.textContent.length){
            updatingElement.textContent = updatingElement.textContent.slice(0, -1);
        }
    }

}
    