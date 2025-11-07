import { execAsync } from "ags/process";
import { createPoll } from "ags/time";
import GLib from "gi://GLib?version=2.0";
import GTop from "gi://GTop?version=2.0";

let previousCpuData = new GTop.glibtop_cpu();

function cpuUsage() {
    const currentCpuData = new GTop.glibtop_cpu();
    GTop.glibtop_get_cpu(currentCpuData);

    const totalDiff = currentCpuData.total - previousCpuData.total;
    const idleDiff = currentCpuData.idle - previousCpuData.idle;

    const cpuUsagePercentage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;

    previousCpuData = currentCpuData;

    return cpuUsagePercentage;
}

function ramUsage() {
    try {
        const [success, meminfoBytes] = GLib.file_get_contents("/proc/meminfo");

        if (!success || meminfoBytes === undefined) {
            throw new Error("Failed to read /proc/meminfo or file content is null.");
        }

        const meminfo = new TextDecoder("utf-8").decode(meminfoBytes);
        const totalMatch = meminfo.match(/MemTotal:\s+(\d+)/);
        const availableMatch = meminfo.match(/MemAvailable:\s+(\d+)/);

        if (!totalMatch || !availableMatch) {
            throw new Error("Failed to parse /proc/meminfo for memory values.");
        }

        const totalRamInBytes = parseInt(totalMatch[1], 10) * 1024;
        const availableRamInBytes = parseInt(availableMatch[1], 10) * 1024;

        let usedRam = totalRamInBytes - availableRamInBytes;
        usedRam = isNaN(usedRam) || usedRam < 0 ? 0 : usedRam;

        const percentageTotal = (usedRam / totalRamInBytes) * 100;
        return totalRamInBytes > 0 ? parseFloat(percentageTotal.toFixed(2)) : 0;
    } catch (error) {
        printerr("Error calculating RAM usage:", error);
        return 0;
    }
}

async function gpuUsage() {
    try {
        const gpuStats = await execAsync("gpustat --json");
        if (typeof gpuStats !== "string") return 0;

        const data = JSON.parse(gpuStats);

        return data.gpus.reduce((acc: number, gpu: { "utilization.gpu": number }) => acc + gpu["utilization.gpu"], 0) / data.gpus.length;
    } catch (error) {
        if (error instanceof Error) {
            printerr("Error getting GPU stats:", error.message);
        } else {
            printerr("Unknown error getting GPU stats");
        }
        return 0;
    }
}

type ResourceUsage = {
    cpu: number;
    ram: number;
    gpu: number;
};

export const resourceUsage = createPoll(
    {
        cpu: 0,
        ram: 0,
        gpu: 0,
    },
    2000,
    async () => ({
        cpu: cpuUsage(),
        ram: ramUsage(),
        gpu: await gpuUsage(),
    } as ResourceUsage)
);
