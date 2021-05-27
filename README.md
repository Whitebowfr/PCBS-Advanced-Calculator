# PCBS Advanced Calculator
 A website and library which plans to help calculate advanced stats such as clocks, voltages, temps, and much more !
 I studied the game's code for 2 days and coded this in an equal amount of time, so it's subject to bugs. (althought I haven't found a lot)
If you have any suggestions on things I could add, feel free to open an issue or even a PR if you know how to code ! More on the code at the bottom.

You can contact me by discord (Whitebow#0749) by messaging me or by mentioning me on the PCBS official server or HEM server.

# Table of contents
[TOC]

# Website
The website will be hosted on githubs pages once it's finished, for now the website is not finished at all.

# Python script
**Disclaimer : the python script isn't as up-to-date as the JS library and is subject to bugs and inaccuracies. It also offers less functions.**
### Download and launch
You can download the file tempCalculator.py and launch it if you have python by using 
`py tempCalculator.py`

once you are in the correct folder.
From there you will be prompted to enter which action you want to perform, and the result will be printed.
### Editing the parts used
You can modify the CPU/GPU/RAM/Case/Case fans/cpu Cooler at the start of the script, you can open it by right clicking on it and clicking "Edit".
Once you finished the changes, you can save and launch it again.
If you just want to test, the parts used currently in the file as example are :
+ AMD Ryzen 5 Quad Core 1400 running at 3500MHz
+ MSI Radeon RX 480 GAMING 8G stock
+ OBT-BC1
+ one ARCTIC BioniX P140
+ a SilverStone HE01
+ two sticks of ADATA XPG Z1 8 GB 4400MHz
+ Components also used but who doesn't affect the output:
    + ASRock B450 Steel Legend
    + CORSAIR Force Series - MP610 M.2 2TB (this one won't affect the install speed since you need to enter the transfer speed)
    + ADATA XPG Core Reactor 850W

To get the stats needed, you can use my (or Jacob's, doesn't matter) helpers, they are [here](https://github.com/Whitebowfr/PCBSGraph/tree/gh-pages/helpers).
#### How to use the helpers
Two options : seeing it in the [data.json](https://raw.githubusercontent.com/Whitebowfr/PCBSGraph/gh-pages/helpers/data.json) file or in the HTML files (they are directly extracted from the game). You can click on the file you want, and click "see raw" because the files are too big. Once it finished loading, you can hit Ctrl + F and search for your part here. Be aware that depending on your computer, it can take some time for the browser to index the file.
You can also use [my graph](https://whitebowfr.github.io/PCBSGraph/) or Jacob's [Parts and Unlocks guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1798336403) to get the information. Some of the stats aren't here thought, like the Multipliers.

#### Overclocking
You can change the frequency of the CPU/GPU/RAM in the file, by modifying respectively freq/m_OCCoreClockFreq or m_OCMemClockFreq/baseFreq.

# JS "library"
I don't know how to make a library, but I tried my best.
The main.js file has the entire code wrapped in a class, so you can add it to your project without worrying about names. (except if you already have a VirtualComputer class)
The main.js file is, well, the main one, the other is a backup in case I push something wrong.
### Compatibility
You can run this file using Node.js, by typing
`node main`
while being in the downloaded directory.
You can also download it and link it to your HTML/JS project using 
    
    <script src="[path/to/main.js]"></script>
### Setting up the system
Before making the calculations, you need to specify the system specs. This is where the JS library is better than the python script.
First of all, you need to create the computer element, using
```javascript
var computer = new VirtualComputer("name")
```
Once you got this object, you need to give it his specs. For that, use :
```javascript
computer.setCpu({});
computer.setGpu([{}]);..
computer.setCpuCooler({});
computer.setStorage({});
computer.setRam([{}]);
computer.setCaseUsed({});
computer.setCaseFansUsed([{}]);
```
Of course, you only need to give it the parts needed, but if you want to be able to fully use the functionnalities, you need to give it all the parts. They can of course be modified afterwards. They all require objects.
#### Demos
##### setCpu
```javascript
computer.setCpu({
    wattage: 180, //This one is needed for all the calculations
    thermalThrottling: 95,
    dies: 2.7, //This one too
    maxFrequency: 4100,
    frequency: 4000,
    currentFreq: 4000,
    voltage: 1.35,
    maxVoltage: 1.55
})
```
frequency = base frequency !
##### setGpu
This one require an array of maximum two GPU objects. you can give it [{}, {GPU}], but it's not optimal.
```javascript
computer.setGpu([{
    m_thermalLimit: 95,
    wattage: 210, //This one is needed
    m_coreClockFreq: 1471,
    m_memClockFreq: 800,
    m_maxCoreClockFreq: 1590,
    m_maxMemClockFreq: 875,
    m_OCcoreClockFreq: 1471,
    m_OCmemClockFreq: 800,
    percentPowerIncrease: 50
},{
    m_thermalLimit: 105,
    wattage: 230,
    m_coreClockFreq: 1471,
    m_memClockFreq: 800,
    m_maxCoreClockFreq: 1590,
    m_maxMemClockFreq: 875,
    m_OCcoreClockFreq: 1471,
    m_OCmemClockFreq: 800,
    percentPowerIncrease: 50
}])
```
##### setCpuCooler
```javascript
computer.setCpuCooler({
    airflow: 80, //Needed
    Type: "Air Cooler"
})
```
##### setStorage
For this one, you don't need to specify ALL the storage in the PC, simply the boot drive.
```javascript
computer.setStorage({
    speed: 1200
})
```
speed = Transfer speed (in MB/s)
##### setRam
```javascript
computer.setRam([{
    frequency: 2133,
    maxFrequency: 2282,
    voltage: 1.2,
    maxVoltage: 1.65,
    currentFreq: 2200,
}])
```
again,  frequency = base frequency.
##### setFans
```javascript
computer.setCaseFans([{
	airflow: 83
}, {
	airflow: 15
}])
```
By default, the fans array is empty.
##### setCase
```javascript
computer.setCase({
	inherentHeat: 25
})
```
By default, it is set to 0 (which is the default value in game as well), only open-air cases have a higher cooling.
##### setCustomWaterLoop
```javascript
computer.setCustomWaterLoop([{
	type: "CPU_BLOCK"
}, {
	type: "WATER_COOLED_GPU"
}, {
	type: "RADIATOR",
	airflow: 105
}])
```
You need at least 1 CPU_BLOCK or WATER_COOLED_GPU element, and the radiators needs to have their airflow. You can also add the pump, but it won't affect the temps.
The custom water cooling is only supported on the CPU, mainly because I still haven't found the part of the code responsible for the GPU temps in a water cooling loop.
The code will choose the custom water cooling loop if it is defined, which means to get back to the cpuCooler element, you need to do
```javascript
computer.setCustomWaterLoop()
```
to delete the element.
##### setSl
```javascript
computer.setSl(1.025)
```
Set the silicon lottery (more below), you don't need to use it since all the functions who needs the silicon lottery value already do it automatically.
##### setup
```javascript
computer.setup()
```
This is more of a debugging function, it transfers the data from the VirtualComputer class to the subclass (that's not how I should do it, but I didn't want to have a ton of function in the main class)

### Using the library
The siliconLottery (or sl) value can be passed to a lot of functions, and is often optional. If you are new to PCBS, it is a random value between 1 and 1.05 assigned to each part (cpu, ram, gpu) and simulate the real silicon lottery (more information about it [here](https://forums.tomshardware.com/threads/what-is-the-silicon-lottery.1442554/))
Without this value, the functions will return an object containing the min and max value for this function. (so with a siliconLottery value of 1.05 and 1).

In PCBS, the temps showed in OCCT are the calculated temp + a random number between -0.5 and +0.5. This means that in the temps calculating functions, if you see two numbers labelled "min" and "max" (or "mi" and "ma") with gap of exactly 1 between them, the min will be the minimum value the part can reach and the max is the maximum.

All temps are rounded to two numbers after the comma in the game, but the functions returns full numbers, you need to round them manually. 
In JS, to round a number to two decimals, your need to use
```javascript
Math.round(number * 100) / 100
```

The other values are often floored. 

If a getSilicon() function returns a sl under 1 and a top of 100 or more, that means that the temp/voltage entered is less than what 100% of the part can do.
#### Functions list
##### CPU
- `idleTemp()`  : returns the idle temp of the CPU. Requires the CPU and cpuCooler object.
- `loadTemp([optional] sl)` : returns the temp under load of the CPU. This requires CPU, cpuCooler, GPU, caseFans, caseUsed.
- `getSilicon([required] temp)` : returns an object containing the silicon (obj.sl)(normally between 1 and 1.05 if the informations are correct), the percentage of the chip (obj.top), and the temps reached under load (obj.temp). It needs the maxTemp reached under load with OCCT, **while under overclocking** (even + 50MHz is enough). The silicon lottery doesn't appear while the cpu is running at stock speeds.
- `voltageRequirement([optional] sl, [optional] freq)` : returns a number which correspond to the voltage required to sustain a specific speed. If the freq is undefined, the speed taken will be the cpu.currentFreq. If the sl is undefined, it will do the best possible voltage (sl = 1.05) and the worst (sl = 1)
- `getMaxVoltage([optional] sl)` : returns a number which correspond to the max voltage reachable by the chip (if sl is declared) before breaking. If sl is undefined, it will return the best and worst.
- `getMaxFrequency([optional] sl)` : returns an object containing the absolute maximum frequency of the chip (obj.freq) , the voltage required to sustain this speed (obj.v), and the temps it will reach (obj.temps). If sl in not declared, it will take sl = 1.05 so the best possible chip. It takes into account if the CPU can support  this voltage, and if the CPU is not thermal throttling (it's very precise so you add 1 MHz to your GPU clock and it's over)

** Examples**
```javascript
computer.Cpu.idleTemp() //returns 37.69593943021692
computer.Cpu.loadTemp() /*returns {
 													 max: { mi: 76.22440817638417, ma: 77.22440817638417 },
  													 min: { mi: 65.69240864827319, ma: 66.69240864827319 }
											}*/
computer.Cpu.loadTempt(1.025) //returns { mi: 71.82577734621847, ma: 72.82577734621847 }
computer.Cpu.getSilicon(83) /* returns {
													   top: 85.62,
													   sl: 1.0071879999999995,
													   temp: { mi: 81.99912129551737, ma: 82.99912129551737 }
											}*/
computer.Cpu.voltageRequirement() /* {
																  min: 1.382499187520312,
																  max: 1.447370983446933,
																  reachable: 'All',
																  maxVreachable: 1.7902500000000001,
																  minVreachable: 1.705
																}*/
computer.Cpu.voltageRequirement(1.025) //1.3987329434697855
computer.Cpu.voltageRequirement(1.025, 4400) // 2.1195906432748544
computer.Cpu.voltageRequirement(undefined, 4500) /*{
																						  min: 1.7299805004874882,
																						  max: 3.286903602726392,
																						  reachable: 'Partial',
																						  maxVreachable: 1.7902500000000001,
																						  minVreachable: 1.705
																						}*/
computer.Cpu.getMaxVoltage(1.025) // 1.747625
computer.Cpu.getMaxFrequency(1.03) /*{
																  freq: 4121.099999999997,
																  v: 1.4573105892777996,
																  temp: 94.95733459744405
																}*/
```

##### Storage
Both of these functions only needs the storage object.
- `getInstallSpeed()` : returns average OmegaOS installation time (in ms), in game it's random, can vary between +-10%
- `getStartupSpeed()` : returns the boot time (in ms), you need to add 4 seconds for the bios icon to disappear as well.

**Examples**
```javascript
computer.Storage.getInstallSpeed() //returns 2000
computer.Storage.getStartupSpeed() //returns 166.66666666666666
```

##### Ram
- `getMaxVoltage([optional] sl)` : returns the max voltage of the RAM stick before breaking
- `getVoltageRequired([optional] sl, [recommended] frequency)` : returns the minimum voltage required to run at the specified frequency, but if it isn't declared then the minimum voltage needed to run at the currentFreq specified in the RAM object.
- `getAverageSilicon([required] voltage) : returns the silicon (obj.sl)` and the percentage of the ram stick (obj.top), it isn't very useful since you can't know the max voltage of a stick without breaking it, but if you get a stable voltage you can use this to use the next function :
- `getMaxFrequency([recommended] sl, [very optional] frequency)` : returns the max freq reachable (obj.freq) and the voltage needed to sustain this speed (obj.vReq). The frequency specified doesn't change the output, it's just to choose from which base value the function should go (it can optimise a tiny tiny bit), and takes the currentFreq from the RAM object if it isn't specified.

**Examples**
```javascript
computer.Ram.getMaxVoltage(1.01) // returns 1.83315
computer.Ram.getVoltageRequired(1.05, 2500) //1.8436983953886887
computer.Ram.getAverageSilicon(1.9) // { top: 6, sl: 1.0469999999999993 }
computer.Ram.getMaxFrequency(1.047) // { vReq: 1.897, freq: 2505 }
```
##### Psu
- `getIdleWattage([optional] sl)` : returns the wattage consumed while idling, if you overclocked nothing, the sl parameter won't do anything
- `getLoadWattage([optional] sl)` : same, but under load.

** Examples**
```javascript
computer.Psu.getIdleWattage() // { max: 316, min: 240 }
computer.Psu.getIdleWattage(1.04) // 297
computer.Psu.getLoadWattage() // { min: 461.7377206019288, max: 545.0506000897128 }
```
##### Gpus
In all the functions below, the slot is required. Slot 0 = first GPU, Slot 1 = second GPU.
- `idleTemp([required] slot, [optional] sl)` : returns the idle temp of the selectionned GPU.
- `loadTemp([required] slot, [optional] sl)` : returns the temp under load of the GPU
- `externalLoadTemp([required] slot, [optional] sl)` : don't know what it does lol
- `voltageRequirement([required] slot, [optional] sl)` : returns the Power Increase needed to sustain the specified clocks
- `getSilicon([required] slot, [required] temp)` : returns the silicon (obj.sl) and the top (obj.top) of the specified GPU, needs the max temp under load (can be found in OCCT)

** Examples**
```javascript
computer.Gpus.idleTemp(0) // { min: 32, max: 32 }
computer.Gpus.loadTemp(0) //{
													  min: { ma: 63.16282414287957, mi: 62.16282414287957 },
													  max: { ma: 67.55989278251263, mi: 66.55989278251263 }
													}
computer.Gpus.externalLoadTemp(0) // { max: 84, min: 84 }
computer.Gpus.voltageRequirement(0) // { min: 116.1654135338346, max: 130.625 }
computer.Gpus.getSilicon(0, 50) // { sl: 1.024534242, top: 50.93 }
```

### Code stuff
If you want to tweak some things, feel free to go check the code, it looks quite complicated but isn't so much. 
So first of all we have the VirtualComputer class. This is what stores the system and contains most of the functions.
Inside this class, we have some variables (idk what the real name is) like Cpu, Gpus, Ram, etc. These contains the functions, this way we can do `computer.Cpu.idleTemp()` and `computer.Gpus.idleTemp(0)`, because if all the functions were in the class, we would have a lot of different functions, for example we would need to do `computer.getCPUIdleTemp()`.
In these variables, we have the setup function, which transfer the system stored in the class to these var. From inside the var, it can be accessed as `this.sys`. 

All the functions can be accessed (from the variables) using `this.sys.foo()`. From outside of the variables, they can be accessed as `this.foo()`.

To see the game code, I used dnSpy on the Assembly-CSharp-Firstpass.dll. 
Most of the functions outside of the variables have the same name in the code, so you can click on Edit -> Search Assemblies.
All the temps calculations are done in the ComputerSave class.

If someone knows how to mod this game, by adding a debug menu from where I can see variables I selected in the code, contact me ! It would be really helpful as I could compare the result of my functions to the real result.

Lastly, if you want to contribute to the project but don't know what to do, message me on discord : Whitebow#0749 (you can find me on the official PCBS discord or the HEM discord). If you know some CSS (I am not very good at that so I could use a bit of help), HTML or JS, or even just want me to explain the code, do not hesitate to contact me !

## Credits
Special thanks to [jacob klein](https://github.com/jacobwklein) for teaching me basic JS and introducing me to PCBS calculators, to Mars for showing me how to extract the game's code, helping me understanding Unity C# and for the support, to Bit for helping me mod the .dlls and to Eejil for translating functions into math equations.