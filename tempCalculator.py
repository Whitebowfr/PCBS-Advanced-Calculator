import json
import random
import time

siliconLottery = 1.05
resultJSON = """{

}"""
cpuJSON = """{
    "wattage": 77,
    "m_thermalLimit": 97,
    "dies": 2,
    "maxFreq": 3200,
    "baseFreq": 3200,
    "freq": 3200,
    "m_maxVoltage": 2,
    "m_voltage": 1.25,
    "coreClockMultiplier": 0.00526,
    "MemChannelsMultiplier": 0.985661,
    "MemClockMultiplier": 1.00483,
    "FinalAdjustment": -4.78467
}"""
pciSlotsJSON = [
    """{"wattage": 150,
    "m_thermalLimit": 95,
    "m_coreClockFreq": 1279,
    "m_memClockFreq": 2000,
    "m_maxCoreClockFreq": 1350,
    "m_maxMemClockFreq": 2200,
    "m_OCcoreClockFreq": 1279,
    "m_OCmemClockFreq": 2000}"""
]
caseUsedJSON = """{
    "inherentHeat": 25
}"""
caseFansJSON = ["""{
    "m_airflow": 83
}"""]
cpuCoolerJSON = """{
    "m_airflow": 171
}"""
ramJSON = """{
    "m_voltage": 1.5,
    "m_maxVoltage": 1.67,
    "m_baseFreq": 1600,
    "channelsUsed": 2
}"""

result = json.loads(resultJSON)
cpu = json.loads(cpuJSON)
caseUsed = json.loads(caseUsedJSON)

def lerp(start, end, amt):
    return start + (end - start) * amt


def GetCPUInternalTemp():
    cpucooledTemp = GetCPUCooledTemp(GetLoadTemp())
    final = GetHeatWithFeedback(cpucooledTemp)
    finalMin = final - 0.5
    finalMax = final + 0.5
    return {"mi": finalMin, "ma": finalMax}

def GetCPUIdleInternalTemp():
    temp = GetCPUCooledTemp(GetIdleTemp())
    minTemp = temp - 0.5
    maxTemp = temp + 0.5
    return { "mi": minTemp, "ma": maxTemp }


def getCpuLoadTempRange():
    resultMin = GetCPUInternalTemp()
    global siliconLottery 
    siliconLottery = 1
    resultMax = GetCPUInternalTemp()
    return {
        "max": resultMax, 
        "min": resultMin
    }


def GetLoadTemp():
    return 25 + (cpu["wattage"] - 10) * 1.25

def GetIdleTemp():
    return 25 + (cpu["wattage"] - 10) * 0.7


def GetPsuLoadTemp():
    return 40


def GetCPUCooledTemp(temp):
    temp /= cpu["dies"]
    temp *= GetCPUOverClockHeatFactor()
    cpuCooler = json.loads(cpuCoolerJSON)
    num2 = cpuCooler["m_airflow"]
    return max(GetIdleTemp() * 0.5 / cpu["dies"], temp * (1 - num2))


def GetCPUOverClockHeatFactor():
    num = 1 - GetCPUCoolingFactor(150)
    num2 = GetLoadTemp() / cpu["dies"] * num
    num3 = lerp(num2, cpu["m_thermalLimit"], GetCPUOverClockFactor(0))
    return num3 / num2


def GetCPUCoolingFactor(airflow):
    return 0.45 + airflow * 0.0007


def GetCPUOverClockFactor(freq):
    if freq == 0:
        freq = cpu["freq"]
    num = siliconLottery * cpu["maxFreq"]
    factor = (freq - cpu["baseFreq"]) / (num + 1 - cpu["baseFreq"])
    return GetNonLinearFactor(factor, 0.1, 3)


def GetNonLinearFactor(factor, underFactor, overFactor):
    if (factor > 1):
        return 1 + (factor - 1) * overFactor
    
    if (factor < 0):
        return factor * underFactor
    
    return factor


def GetHeatWithFeedback(temp):
    caseLoadTemp = GetCaseLoadTemp()
    if (caseLoadTemp > 25):
        temp += max(0, caseLoadTemp - 25) * 1
    
    return temp


def GetCaseLoadTemp():
    num = 0
    num += GetPsuLoadTemp()
    num += GetLoadTemp() * GetCPUOverClockHeatFactor()
    for elJSON in pciSlotsJSON:
        el = json.loads(elJSON)
        num += GetLoadExternalTemp(el) * GetGPUOverClockHeatFactor(el)
    return GetCaseTemp(num)


def GetCaseTemp(componentHeat):
    num = componentHeat * 0.04
    num2 = caseUsed["inherentHeat"]
    for elJSON in caseFansJSON:
        el = json.loads(elJSON)
        num2 += GetCaseCoolingFactor(el)
    num *= max(0, 1 - abs(num2))
    num += 21
    return max(num, 21)


def GetCaseCoolingFactor(fan):
    return fan["m_airflow"] * 0.001


def GetLoadExternalTemp(part):
    return part["wattage"] * 0.4


def GetGPUOverClockHeatFactor(gpuPart):
    loadInternalTemp = 50
    num = lerp(loadInternalTemp, gpuPart["m_thermalLimit"], GetGPUOverClockFactor(gpuPart))
    return num / loadInternalTemp


def GetGPUOverClockFactor(gpuPart):
    num = (gpuPart["m_OCcoreClockFreq"] - gpuPart["m_coreClockFreq"]) / (gpuPart["m_maxCoreClockFreq"] * siliconLottery + 1 - gpuPart["m_coreClockFreq"])
    num = GetNonLinearFactor(num, 0.1, 3)
    num2 = (gpuPart["m_OCmemClockFreq"] - gpuPart["m_memClockFreq"]) / (gpuPart["m_maxMemClockFreq"] * siliconLottery + 1 - gpuPart["m_memClockFreq"])
    num2 = GetNonLinearFactor(num2, 0.1, 3)
    return (num + num2) / 2

def getCPUSilicon(temp):
    a = 1
    c = 0.01
    while (round(getTemp("setSilicon", a)["ma"], 4) != temp):
        while (getTemp("setSilicon", a)["ma"] > temp):
            a += c
        while (getTemp("setSilicon", a)["ma"] < temp):
            a -= c
        c /= 10
    print("TOP", round((1.05 - a) * 2000, 4), "% Silicon")
    return a

def getGPUSilicon(temp):
    global siliconLottery
    siliconLottery = 1
    a = 1
    c = 0.1
    while (round(getGPULoadTemp(0, a)["ma"], 4) != float(temp)):
        while (getGPULoadTemp(0, a)["ma"] < float(temp)):
            a += c
        while (getGPULoadTemp(0, a)["ma"] > float(temp)):
            a -= c
        c /= 10
    print("TOP", round((1.05 - a) * 2000, 4), "% Silicon")
    return a

def GetRAMVoltageRequirement(speed):
    ram = json.loads(ramJSON)
    num = 0
    num2 = float((siliconLottery + 10 * 0.01) * int(ram["m_baseFreq"]))
    num3 = int(ram["m_baseFreq"])
    num4 = (speed - int(ram["m_baseFreq"])) / (num2 + 1 - num3)
    if num4 > 1:
        num4 = 1 + (num4 - 1) * 3
    num = max(num, lerp(float(ram["m_voltage"]), float(ram["m_maxVoltage"]), max(0, num4)))
    return num

def getRamVoltageRequired(speed):
    global siliconLottery
    siliconLottery = 1
    maxV = GetRAMVoltageRequirement(int(speed))
    siliconLottery = 1.05
    minV = GetRAMVoltageRequirement(int(speed))
    ram = json.loads(ramJSON)
    if float(ram["m_maxVoltage"] * 110 / 100 * 1) < maxV:
        if float(ram["m_maxVoltage"] * 110 / 100 * 1.05) < minV:
            print("These voltages cannot be accessed, so the frequency is unreachable")
        else:
            print("These voltages can be accessed by some silicon, the worst voltage for this ram is ", float(ram["m_maxVoltage"]) * 110 / 100, "V")

    return {"min": minV, "max": maxV}

def GetCPUVoltageRequirement(freq):
    global siliconLottery
    siliconLottery = 1
    maxV = lerp(cpu["m_voltage"], cpu["m_maxVoltage"], GetCPUOverClockFactor(freq))
    siliconLottery = 1.05
    minV = lerp(cpu["m_voltage"], cpu["m_maxVoltage"], GetCPUOverClockFactor(freq))
    if float(cpu["m_maxVoltage"]) * 110 / 100 < maxV:
        if float(cpu["m_maxVoltage"]) * 110 / 100 * 1.05 < minV:
            print("No CPU will be able to reach this frequency, best possible voltage is ", float(cpu["m_maxVoltage"]) * 110 / 100 * 1.05, "V")
        else:
            print("Some CPUs won't be able to access this frequency, the worst voltage for this CPU is", float(cpu["m_maxVoltage"]) * 110 / 100, "V")
    return {"min": minV, "max": maxV}

def getTemp(type, opt):
    if type == "range":
        return getCpuLoadTempRange()
    elif type == "setSilicon":
        global siliconLottery 
        siliconLottery = opt
        return GetCPUInternalTemp()
    elif type == "getSilicon":
        return getCPUSilicon(opt)
    elif type == "idle":
        return GetCPUIdleInternalTemp()

def getFpsOnCpuTest():
    ram = json.loads(ramJSON)
    a = float(cpu["coreClockMultiplier"]) * int(cpu["freq"]) + float(cpu["MemChannelsMultiplier"]) * int(ram["channelsUsed"]) + float(cpu["MemClockMultiplier"]) * int(ram["m_baseFreq"]) + float(cpu["FinalAdjustment"])
    return max(a, 0)

def getWattage(load):
    if load == True:
        loadFactor = 1
    else:
        loadFactor = 0.25
    num = cpu["wattage"] * loadFactor * GetCPUOverClockHeatFactor()
    num2 = 0
    for gpuJSON in pciSlotsJSON:
        gpu = json.loads(gpuJSON)
        num2 += (gpu["wattage"] * GetGPUOverClockHeatFactor(gpu) * loadFactor)
    return 30 + num + num2

def printProgressBar (iteration, total, prefix = '', suffix = '', decimals = 1, length = 100, fill = '█', printEnd = "\r"):
    percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
    filledLength = int(length * iteration // total)
    bar = fill * filledLength + '-' * (length - filledLength)
    print(f'\r{prefix} |{bar}| {percent}% {suffix}', end = printEnd)
    if iteration == total: 
        print()

def GetGPULoadInternalTemp(slot):
    if slot > len(pciSlotsJSON):
        return 0
    gpu = json.loads(pciSlotsJSON[slot])
    num3 = 50
    num3 *= GetGPUOverClockHeatFactor(gpu)
    return {"mi": GetHeatWithFeedback(num3) - 0.5, "ma": GetHeatWithFeedback(num3) + 0.5}

def getGPULoadTemp(slot, sl):
    global siliconLottery
    if sl == 0:
        siliconLottery = 1
        maxT = GetGPULoadInternalTemp(slot)
        siliconLottery = 1.05
        minT = GetGPULoadInternalTemp(slot)
        return {"max": maxT, "min": minT}
    else:
        siliconLottery = sl
        return GetGPULoadInternalTemp(slot)
    
def getMaxFrequency():
    a = cpu["freq"]
    c = 100
    while round(GetCPUVoltageRequirement(a)["min"], 3) != round((float(cpu["m_maxVoltage"]) * 110 / 100 * 1.05), 3):
        while GetCPUVoltageRequirement(a)["min"] < (float(cpu["m_maxVoltage"]) * 110 / 100 * 1.05):
            a += c
        while GetCPUVoltageRequirement(a)["min"] > (float(cpu["m_maxVoltage"]) * 110 / 100 * 1.05):
            a -= c
        c /= 10
    return a

def getOSInstallTime(speed, bar):
    if bar:
        printProgressBar(0, 60, prefix = 'Progress:', suffix = 'Complete', length = 63)
    storageSpeedFactor = int(speed) / 200
    timer = 0
    duration = 60
    start = int(round(time.time() * 1000))
    if bar:
        while timer < duration:
            timer += 0.03 * random.randint(0,10) * storageSpeedFactor
            printProgressBar(timer, 60, prefix = 'Progress:', suffix = 'Complete', length = 63)
            time.sleep(0.020)
        print("\n")
        print(int(round(time.time() * 1000)) - start, "ms")
    else:
        print((60 / (0.25 * (storageSpeedFactor))) * 50, "ms")

print("Enter what you want to do (range, setSilicon, getSilicon, idle, wattage, OSinstall, ramRequirement, cpuRequirement, cpuFps, gpuLoadTemp, getMaxFreq)")
inputt = input()
if inputt == "range":
    print(getTemp("range", 0))
elif inputt == "setSilicon":
    print("Enter siliconLottery value override")
    inputBis = input()
    print(getTemp("setSilicon", float(inputBis)))
elif inputt == "getSilicon":
    print("Enter max temp reached in OCCT")
    inputBis = input()
    print(getTemp("getSilicon", float(inputBis)))
elif inputt == "idle":
    print(getTemp("idle", 0))
elif inputt == "wattage":
    print({"idle": getWattage(False), "load": getWattage(True)})
elif inputt == "OSinstall":
    print("Enter speed in MB/s")
    inputBis = input()
    print("Do you want to see the average or do a simulation ? (avg/sim)")
    inputTrio = input()
    getOSInstallTime(inputBis, inputTrio == "sim")
elif inputt == "ramRequirement":
    print("Enter frequency")
    inputBis = input()
    print(getRamVoltageRequired(inputBis))
elif inputt == "cpuRequirement":
    print(GetCPUVoltageRequirement(0))
elif inputt == "cpuFps":
    print(getFpsOnCpuTest())
    print("This result can vary since a lot of times the bench closes while the FPS aren't at their max, but on the end result it should be exact")
elif inputt == "gpuLoadTemp":
    print(getGPULoadTemp(0, 0))
elif inputt == "getMaxFreq":
    print(getMaxFrequency())