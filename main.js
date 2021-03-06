class VirtualComputer {
    constructor(name) {
        this.name = name
        this.case = {}
        this.case.inherentHeat = 0
        this.caseFans = []
        this.siliconLottery = 1
    }

    setCpu(el) {
        this.cpu = el
        this.setup()
    }

    setGpu(ar) {
        this.gpus = ar
        this.setup()
    }

    setRam(el) {
        this.ram = el
        this.setup()
    }

    setCpuCooler(el) {
        this.cpuCooler = el
        this.setup()
    }

    setStorage(el) {
        this.storage = el
        this.setup()
    }

    setCase(el) {
        this.case = el
        this.setup()
    }

    setCaseFans(ar) {
        this.caseFans = ar
        this.setup()
    }

    setCustomWaterLoop(ar) {
        this.customWaterLoop = ar
        this.setup()
    }

    setSl(sl) {
        this.siliconLottery = sl
        this.setup()
    }

    setup() {
        this.Cpu.setup(this)
        this.Gpus.setup(this)
        this.Ram.setup(this)
        this.Psu.setup(this)
        this.Storage.setup(this)
    }

    Cpu = {
        setup: function(el) {
            this.sys = el
        },
        idleTemp: function() {
            if (this.sys.cpu == undefined) {
                console.error("CPU has not been defined")
                return false
            }
            return this.sys.GetCPUIdleInternalTemp(this.sys)
        },

        loadTemp: function(sl) {
            if (this.sys.cpu == undefined || this.sys.gpus == undefined || this.sys.cpuCooler == undefined) {
                console.error("Something has not been defined")
                return false
            }
            return this.sys.getCpuLoadTemp(sl == undefined ? 0 : sl, this.sys)
        },

        getSilicon: function(temp) {
            if (this.sys.cpu.currentFreq == this.sys.cpu.frequency) {
                console.error("You need to overclock your CPU !")
                return false
            }
            let a = 1
            let c = 1
            while (Math.round(this.sys.getCpuLoadTemp(a, this.sys).ma * 10000) / 10000 != temp) {
                while (this.sys.getCpuLoadTemp(a, this.sys).ma < temp) {
                    a = a - c
                }
                while (this.sys.getCpuLoadTemp(a, this.sys).ma > temp) {
                    a += c
                }
                c /= 10
                if (c < 0.000001) {
                    break
                }
            }
            return {
                top: Math.round((1.05 - a) * 200000) / 100,
                sl: a,
                temp: this.sys.getCpuLoadTemp(a, this.sys)
            }
        },

        voltageRequirement: function(sl, freq) {
            if (sl == undefined) {
                this.sys.cpu.currentFreq = (freq == undefined ? this.sys.cpu.currentFreq : freq)
                this.sys.setSl(1)
                let maxV = this.sys.lerp(this.sys.cpu.voltage, this.sys.cpu.maxVoltage, this.sys.GetCPUOverClockFactor(this.sys.cpu))
                this.sys.setSl(1.05)
                let minV = this.sys.lerp(this.sys.cpu.voltage, this.sys.cpu.maxVoltage, this.sys.GetCPUOverClockFactor(this.sys.cpu))
                let accessibility = "All"
                if (this.sys.cpu.maxVoltage * 110 / 100 < maxV) {
                    if (this.sys.cpu.maxVoltage * 110 / 100 * 1.05 < minV) accessibility = "None"
                    else accessibility = "Partial"
                }
                return { "min": minV, "max": maxV, "reachable": accessibility, "maxVreachable": this.sys.cpu.maxVoltage * 110 / 100 * 1.05, "minVreachable": this.sys.cpu.maxVoltage * 110 / 100 }
            } else {
                this.sys.cpu.currentFreq = (freq == undefined ? this.sys.cpu.currentFreq : freq)
                this.sys.setSl(sl)
                return this.sys.lerp(this.sys.cpu.voltage, this.sys.cpu.maxVoltage, this.sys.GetCPUOverClockFactor(this.sys.cpu))
            }
        },

        getMaxVoltage: function(sl) {
            if (sl == undefined) {
                return { "best": this.sys.cpu.maxVoltage * 110 / 100 * 1.05, "worst": this.sys.cpu.maxVoltage * 110 / 100 }
            } else {
                return this.sys.cpu.maxVoltage * 110 / 100 * sl
            }
        },

        getMaxFrequency: function(sl) {
            var a = this.sys.cpu.currentFreq
            let c = 100
            sl = (sl == undefined ? 1.05 : sl)
            while (Math.round(this.voltageRequirement(sl, a) * 1000) / 1000 != Math.round(this.sys.cpu.maxVoltage * 110 / 100 * sl * 1000) / 1000 && this.loadTemp(sl).ma < this.sys.cpu.thermalThrottling) {
                while (Math.round(this.voltageRequirement(sl, a) * 1000) / 1000 < Math.round(this.sys.cpu.maxVoltage * 110 / 100 * sl * 1000) / 1000 && this.loadTemp(sl).ma < this.sys.cpu.thermalThrottling) {
                    a += c
                }
                while (Math.round(this.voltageRequirement(sl, a) * 1000) / 1000 > Math.round(this.sys.cpu.maxVoltage * 110 / 100 * sl * 1000) / 1000 && this.loadTemp(sl).ma < this.sys.cpu.thermalThrottling) {
                    a -= c
                }
                this.sys.cpu.currentFreq = a
                if (this.loadTemp(sl).ma > this.sys.cpu.thermalThrottling) {
                    c /= 10
                    while (this.loadTemp(sl).ma > this.sys.cpu.thermalThrottling) {
                        this.sys.cpu.currentFreq = a
                        a -= c
                    }
                }
                c /= 10
                if (c < 0.1) {
                    break;
                }
            }
            return { freq: a, v: this.voltageRequirement(sl, a), temp: this.loadTemp(sl).ma }
        },

        getFps: function() {
            let a = this.sys.cpu.coreClockMultiplier * this.sys.cpu.currentFreq + this.sys.cpu.memChannelsMultiplier * this.sys.ram[0].channelUsed + this.sys.cpu.memClockMultiplier * this.sys.ram[0].currentFreq + this.sys.cpu.finalAdjustment
            return Math.max(a, 0)
        },

        getScore: function() {
            return Math.max(0, (298 * this.getFps()))
        }
    }

    Storage = {
        setup: function(el) {
            this.sys = el
        },

        getInstallSpeed: function() {
            if (this.sys.storage == undefined) {
                console.log("Storage has not been defined")
                return false
            }
            return (60 / (0.25 * (this.sys.storage.speed / 200))) * 50
        },

        getStartupSpeed: function() {
            return 1 / (this.sys.storage.speed / 200) * 1000
        }
    }

    Ram = {
        setup: function(el) {
            this.sys = el
        },

        getMaxVoltage: function(sl) {
            if (this.sys.ram == undefined) {
                console.log("RAM has not been defined")
                return false
            }
            if (sl == undefined) {
                return { "best": this.sys.ram[0].maxVoltage * 110 / 100 * 1.05, "worst": this.sys.ram[0].maxVoltage * 110 / 100 }
            } else {
                return this.sys.ram[0].maxVoltage * 110 / 100 * sl
            }
        },

        getVoltageRequired: function(sl, sped) {
            let num = 0,
                numBis = 0,
                speed = (sped == undefined ? this.sys.ram[0].currentFreq == undefined ? this.sys.ram[0].frequency : this.sys.ram[0].currentFreq : sped)
            this.sys.setSl(sl == undefined ? 1 : sl)
            this.sys.ram.forEach((el) => {
                let num4 = (speed - el.frequency) / (((this.sys.siliconLottery + 10 * 0.01) * el.frequency) + 1 - el.frequency)
                if (num4 > 1) num4 = 1 + (num4 - 1) * 3
                num = Math.max(num, this.sys.lerp(el.voltage, el.maxVoltage, Math.max(0, num4)))
            })
            if (sl != undefined) {
                return num
            }
            this.sys.setSl(1.05)
            this.sys.ram.forEach((el) => {
                let num4 = (speed - el.frequency) / (((this.sys.siliconLottery + 10 * 0.01) * el.frequency) + 1 - el.frequency)
                if (num4 > 1) num4 = 1 + (num4 - 1) * 3
                numBis = Math.max(numBis, this.sys.lerp(el.voltage, el.maxVoltage, Math.max(0, num4)))
            })
            return { "min": numBis, "max": num }
        },

        getAverageSilicon: function(v) {
            let a = 1
            let c = 0.01
            while (Math.round(this.getMaxVoltage(a) * 1000) / 1000 != v) {
                while (Math.round(this.getMaxVoltage(a) * 1000) / 1000 < v) {
                    a += c
                }
                while (Math.round(this.getMaxVoltage(a) * 1000) / 1000 > v) {
                    a -= c
                }
                c /= 10
                if (c < 0.00001) break
            }
            return {
                top: Math.round((1.05 - a) * 200000) / 100,
                sl: a,
            }
        },

        getMaxFrequency: function(sl, f) {
            let a = (f == undefined || f == 0 ? this.sys.ram[0].currentFreq : f)
            let c = 100
            this.sys.setSl(sl == undefined ? 1 : sl)
            while (Math.round(this.getVoltageRequired(this.sys.siliconLottery, a) * 1000) / 1000 != this.getMaxVoltage(this.sys.siliconLottery)) {
                while (Math.round(this.getVoltageRequired(this.sys.siliconLottery, a) * 1000) / 1000 < this.getMaxVoltage(this.sys.siliconLottery)) {
                    a += c
                }
                while (Math.round(this.getVoltageRequired(this.sys.siliconLottery, a) * 1000) / 1000 > this.getMaxVoltage(this.sys.siliconLottery)) {
                    a -= c
                }
                c /= 10
                if (c < 1) {
                    break
                }
            }
            return { vReq: Math.round(this.getVoltageRequired(this.sys.siliconLottery, a) * 1000) / 1000, freq: a }
        }
    }

    Gpus = {
        setup: function(el) {
            this.sys = el
        },

        idleTemp: function(slot, sl) {
            if (slot > this.sys.gpus.length - 1) return false
            if (sl == undefined) {
                this.sys.setSl(1)
                let a = 32 * this.sys.GetGPUOverClockHeatFactor(this.sys.gpus[slot])
                this.sys.setSl(1.05)
                let b = 32 * this.sys.GetGPUOverClockHeatFactor(this.sys.gpus[slot])
                return { "min": b, "max": a }
            } else {
                this.sys.setSl(sl)
                return 32 * this.sys.GetGPUOverClockHeatFactor(this.sys.gpus[slot])
            }
        },

        loadTemp: function(slot, sl) {
            if (slot > this.sys.gpus.length - 1) return false
            let num3 = 50
            if (sl == undefined) {
                this.sys.setSl(1)
                let a = num3 * this.sys.GetGPUOverClockHeatFactor(this.sys.gpus[slot])
                a = this.sys.GetHeatWithFeedback(a, this.sys)
                this.sys.setSl(1.05)
                let b = num3 * GetGPUOverClockHeatFactor(this.sys.gpus[slot])
                b = this.sys.GetHeatWithFeedback(b, this.sys)
                return { "min": { ma: b + 0.5, mi: b - 0.5 }, "max": { ma: a + 0.5, mi: a - 0.5 } }
            } else {
                this.sys.setSl(sl)
                num3 *= this.sys.GetGPUOverClockHeatFactor(this.sys.gpus[slot])
                return { ma: this.sys.GetHeatWithFeedback(num3, this.sys) + 0.5, mi: this.sys.GetHeatWithFeedback(num3, this.sys) - 0.5 }
            }
        },

        externalLoadTemp: function(slot, sl) {
            if (slot > this.sys.gpus.length - 1) return false
            if (sl == undefined) {
                this.sys.setSl(1)
                let a = this.sys.gpus[slot].wattage * 0.4 * this.sys.GetGPUOverClockHeatFactor(this.sys.gpus[slot])
                this.sys.setSl(1.05)
                let b = this.sys.gpus[slot].wattage * 0.4 * this.sys.GetGPUOverClockHeatFactor(this.sys.gpus[slot])
                return { "max": a, "min": b }
            } else {
                this.sys.setSl(sl)
                return this.sys.gpus[slot].wattage * 0.4 * this.sys.GetGPUOverClockHeatFactor(this.sys.gpus[slot])
            }
        },

        voltageRequirement: function(slot, sl) {
            if (sl != undefined) {
                this.sys.setSl(sl)
                return this.sys.lerp(100, (100 + this.sys.gpus[slot].percentPowerIncrease), this.sys.GetGPUOverClockFactor(this.sys.gpus[slot]))
            } else {
                this.sys.setSl(1)
                let a = this.sys.lerp(100, (100 + this.sys.gpus[slot].percentPowerIncrease), this.sys.GetGPUOverClockFactor(this.sys.gpus[slot]))
                this.sys.setSl(1.05)
                let b = this.sys.lerp(100, (100 + this.sys.gpus[slot].percentPowerIncrease), this.sys.GetGPUOverClockFactor(this.sys.gpus[slot]))
                return { "min": b, "max": a }
            }
        },

        getSilicon: function(slot, tmp) {
            let a = 1
            let c = 0.01
            while (Math.round(this.loadTemp(slot, a) * 1000) / 1000 != tmp) {
                while (Math.round(this.loadTemp(slot, a) * 1000) / 1000 > tmp) {
                    a -= c
                }
                while (Math.round(this.loadTemp(slot, a) * 1000) / 1000 < tmp) {
                    a += c
                }
                c /= 10
                if (c < 0.0001) {
                    break
                }
            }
            return { sl: a, top: Math.round((1.05 - a) * 200000) / 100 }
        },

        Get3DMarkTestScore: function(test) {
            var a = 0
            var gpu = this.sys.gpus[0]
            if (this.sys.gpus.length == 1) {
                if (test == 1) {
                    a = ((gpu.GT1SingleCoreClockMultiplier * gpu.m_OCcoreClockFreq) + (gpu.GT1SingleMemClockMultiplier * gpu.m_OCmemClockFreq) + (gpu.GT1SingleBenchmarkAdjustment))
                } else {
                    a = ((gpu.GT2SingleCoreClockMultiplier * gpu.m_OCcoreClockFreq) + (gpu.GT2SingleMemClockMultiplier * gpu.m_OCmemClockFreq) + (gpu.GT2SingleBenchmarkAdjustment))
                }
            } else {
                if (test == 1) {
                    a = ((gpu.GT1DualCoreClockMultiplier * gpu.m_OCcoreClockFreq) + (gpu.GT1DualMemClockMultiplier * gpu.m_OCmemClockFreq) + (gpu.GT1DualBenchmarkAdjustment))
                } else {
                    a = ((gpu.GT2DualCoreClockMultiplier * gpu.m_OCcoreClockFreq) + (gpu.GT2DualMemClockMultiplier * gpu.m_OCmemClockFreq) + (gpu.GT2DualBenchmarkAdjustment))
                }
            }
            return a
        },

        getScore: function() {
            let num = 1 / this.Get3DMarkTestScore(1)
            let num2 = 1 / this.Get3DMarkTestScore(2)
            return Math.max(0, (328 / (num + num2)))
        },
    }

    Psu = {
        setup: function(el) {
            this.sys = el
        },

        getIdleWattage: function(sl) {
            if (sl == undefined && (this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) != 1 || this.sys.GetGPUOverClockHeatFactor(el) != 1)) {
                this.sys.setSl(1)
                let num = this.sys.cpu.wattage * this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) * 0.25
                this.sys.gpus.forEach((el) => {
                    num += (el.wattage * this.sys.GetGPUOverClockHeatFactor(el))
                })
                this.sys.setSl(1.05)
                let num2 = this.sys.cpu.wattage * this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) * 0.25
                num2 = 0
                this.sys.gpus.forEach((el) => {
                    num2 += (el.wattage * this.sys.GetGPUOverClockHeatFactor(el))
                })
                return { "max": Math.floor(num + 30), "min": Math.floor(num2 + 30) }
            } else if (sl != undefined && (this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) != 1 || this.sys.GetGPUOverClockHeatFactor(el) != 1)) {
                this.sys.setSl(sl)
                let num = this.sys.cpu.wattage * this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) * 0.25
                let num2 = 0
                this.sys.gpus.forEach((el) => {
                    num2 += (el.wattage * this.sys.GetGPUOverClockHeatFactor(el))
                })
                return Math.floor(num + num2 + 30)
            } else {
                let num = this.sys.cpu.wattage * this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) * 0.25
                let num2 = 0
                this.sys.gpus.forEach((el) => {
                    num2 += (el.wattage * this.sys.GetGPUOverClockHeatFactor(el))
                })
                return Math.floor(num + num2 + 30)
            }
        },

        getLoadWattage: function(sl) {
            if (sl == undefined && (this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) != 1 || this.sys.GetGPUOverClockHeatFactor(el) != 1)) {
                this.sys.setSl(1)
                let num = this.sys.cpu.wattage * this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) + 30
                this.sys.gpus.forEach((el) => {
                    num += (el.wattage * this.sys.GetGPUOverClockHeatFactor(el))
                })
                this.sys.setSl(1)
                let num2 = this.sys.cpu.wattage * this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) + 30
                this.sys.gpus.forEach((el) => {
                    num2 += (el.wattage * this.sys.GetGPUOverClockHeatFactor(el))
                })
                return { "min": num2, "max": num }
            } else if (sl != undefined && (this.sys.GetCPUOverClockHeatFactor(this.sys.cpu) != 1 || this.sys.GetGPUOverClockHeatFactor(el) != 1)) {
                this.sys.setSl(sl)
                let num = this.sys.cpu.wattage * 1 * this.sys.GetCPUOverClockHeatFactor(this.sys.cpu)
                let num2 = 0
                this.sys.gpus.forEach((el) => {
                    num2 += (el.wattage * this.sys.GetGPUOverClockHeatFactor(el))
                })
                num2 * 1
                return Math.floor(num + 30 + num2)
            } else {
                let num = this.sys.cpu.wattage * 1 * this.sys.GetCPUOverClockHeatFactor(this.sys.cpu)
                let num2 = 0
                this.sys.gpus.forEach((el) => {
                    num2 += (el.wattage * this.sys.GetGPUOverClockHeatFactor(el))
                })
                num2 * 1
                return Math.floor(num + 30 + num2)
            }
        }
    }

    Get3DMarkScore() {
        return (1 / (0.85 / this.Cpu.getScore() + 0.15 / this.Gpus.getScore()))
    }

    Get3DMarkCPUScore() {}

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end
    }

    GetGPUOverClockHeatFactor(gpuPart) {
        let loadInternalTemp = 50;
        let num = this.lerp(loadInternalTemp, gpuPart.m_thermalLimit, this.GetGPUOverClockFactor(gpuPart));
        return num / loadInternalTemp;
    }

    GetGPUOverClockFactor(gpuPart) {
        let num = (gpuPart.m_OCcoreClockFreq - gpuPart.m_coreClockFreq) / (gpuPart.m_maxCoreClockFreq * this.siliconLottery + 1 - gpuPart.m_coreClockFreq);
        num = this.GetNonLinearFactor(num, 0.1, 3);
        let num2 = (gpuPart.m_OCmemClockFreq - gpuPart.m_memClockFreq) / (gpuPart.m_maxMemClockFreq * this.siliconLottery + 1 - gpuPart.m_memClockFreq);
        num2 = this.GetNonLinearFactor(num2, 0.1, 3);
        return (num + num2) / 2;
    }

    GetCaseTemp(componentHeat, sys) {
        let num = componentHeat * 0.04;
        let num2 = sys.case.inherentHeat;
        sys.caseFans.forEach((el) => {
            num2 += this.GetCaseCoolingFactor(el);
        })
        num *= Math.max(0, 1 - Math.abs(num2));
        num += 21;
        return Math.max(num, 21);
    }

    GetCaseCoolingFactor(fan) {
        return fan.m_airflow * 0.001;
    }

    GetLoadExternalTemp(el) {
        return el.wattage * 0.4;
    }

    GetCPUCoolingFactor(airflow) {
        return 0.45 + airflow * 0.0007;
    }

    GetNonLinearFactor(factor, underFactor, overFactor) {
        if (factor > 1) {
            return 1 + (factor - 1) * overFactor;
        }
        if (factor < 0) {
            return factor * underFactor;
        }
        return factor;
    }

    GetHeatWithFeedback(temp, sys) {
        let caseLoadTemp = this.GetCaseLoadTemp(sys);
        if (caseLoadTemp > 25) {
            temp += Math.max(0, caseLoadTemp - 25) * 1;
        }
        return temp;
    }

    GetCPUCooledTemp(temp, sys) {
        temp /= sys.cpu.dies;
        temp *= this.GetCPUOverClockHeatFactor(sys.cpu);
        let num2 = 0
        if (sys.customWaterLoop != undefined) {
            let num = this.GetAFPerComponent(sys.customWaterLoop);
            num2 = (num <= 0 ? 0 : this.GetCPUCoolingFactor(num))
        } else {
            num2 = this.GetCPUCoolingFactor(sys.cpuCooler.airFlow)
        }
        return Math.max(this.GetIdleTemp(sys.cpu) * 0.5 / sys.cpu.dies, temp * (1 - num2));
    }

    GetAFPerComponent(loop) {
        let num = 0
        let num2 = 0
        for (component in loop) {
            switch (component.type) {
                case "CPU_BLOCK":
                    num++
                    break;
                case "WATER_COOLED_GPU":
                    num++
                    break;
                case "RADIATOR":
                    num2 += component.airflow * 1.5
                    break;
                default:
                    break;
            }
        }
        return num2 / num
    }

    GetCPULoadInternalTemp(sys) {
        let temp = this.GetLoadTemp(sys.cpu);
        let cpucooledTemp = this.GetCPUCooledTemp(temp, sys);
        let final = this.GetHeatWithFeedback(cpucooledTemp, sys)
        return { mi: final - 0.5, ma: final + 0.5 }
    }

    GetCPUIdleInternalTemp(sys) {
        return this.GetCPUCooledTemp(this.GetIdleTemp(sys.cpu), sys)
    }

    getCpuLoadTemp(silicon, sys) {
        if (silicon == undefined || silicon == 0) {
            result.max = this.GetCPULoadInternalTemp(sys)
            this.setSl(1)
            result.min = this.GetCPULoadInternalTemp(sys)
        } else {
            this.setSl(silicon)
            result = this.GetCPULoadInternalTemp(sys)
        }
        return result
    }

    GetLoadTemp(cpu) {
        return 25 + (cpu.wattage - 10) * 1.25;
    }

    GetIdleTemp(cpu) {
        return 25 + (cpu.wattage - 10) * 0.7;
    }

    GetPsuLoadTemp() {
        return 40
    }

    GetCPUOverClockHeatFactor(cpu) {
        let num = 1 - this.GetCPUCoolingFactor(150);
        let num2 = this.GetLoadTemp(cpu) / cpu.dies * num;
        let num3 = this.lerp(num2, cpu.thermalThrottling, this.GetCPUOverClockFactor(cpu));
        return num3 / num2;
    }

    GetCPUOverClockFactor(cpu) {
        let num = this.siliconLottery * cpu.maxFrequency;
        let factor = (cpu.currentFreq - cpu.frequency) / (num + cpu.dies - cpu.frequency);
        return this.GetNonLinearFactor(factor, 0.1, 3);
    }

    GetCaseLoadTemp(sys) {
        let num = 0;
        num += this.GetPsuLoadTemp();
        num += this.GetLoadTemp(sys.cpu) * this.GetCPUOverClockHeatFactor(sys.cpu);
        sys.gpus.forEach((el) => {
            num += this.GetLoadExternalTemp(el) * this.GetGPUOverClockHeatFactor(el);
        })
        return this.GetCaseTemp(num, sys);
    }
}