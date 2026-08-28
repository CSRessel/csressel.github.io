---
slug: eink-tablet-part1
title: "E Ink tablets: Rooting a Boox Go 10.3"
authors: csressel
---

## Motivation

I haven't worked on a lower-level systems project in a while, I haven't worked on reversing or binaries since a brief stint in college, I've never worked on anything in the Android software ecosystem, and I haven't yet written or modified Linux device drivers myself.

Directly in line with those goals is an unmet hardware need: my growing desire for an E Ink tablet that will run an open source Android build.
I've heard that some users have gotten LineageOS running on a Hisense, which is in the neighborhood of what I would be interested in.
However, my note taking preferences require the screen real estate of a tablet. 
For several months, I've used a Boox Go 10.3 as an untrusted device solely for epub reading.
As time has gone on, this tablet's full Play Store access on an Android build hints at tantalizing possibilities: the congruous feeling of a paper-like calendar or planner, an E Ink optimized RSS reader, note taking and email on the go, all further enabled by my obsession with small form factor wireless keyboards.
With that dream in mind, this is the perfect fit to learn a bit about AOSP and device drivers.

## Project Goals

With my lay understanding of the hardware/software boundary in the mobile ecosystem, long term I would be curious how far I can get towards deploying an Android custom ROM to the Boox Go 10.3.
This unfortunately entails the very tough challenge of a full device bringup.
Boox has made this even tougher by not open sourcing either their kernel or the device tree.
For this to be minimally usable, it would require support for:

<!-- truncate -->
- Display driver (Carta 1200 10.3 inch)
- Capacitive touch controller
- Wireless chipset driver (wifi + bt)

And nice-to-have's include:

- Wacom EMR driver
- any quality of life improvements on the screen refresh or tearing
- E Ink friendly UI elements (lock screen, menus, launcher)
- emulate some of the Onyx per-app optimizations (refresh modes, dark color enhancement, light color filter, etc).

I know I'll have to further define or correct that mile high overview as I go. It might even be possible that I need to re-target my work on a different hardware platform! (Whether that's a different Boox model, a reMarkable for the [better DX](https://developer.remarkable.com/documentation/software-stack), or the HiSense.)
Further resources:

- LineageOS's engineering series:
    - https://lineageos.org/engineering/Qualcomm-Firmware/
    - https://lineageos.org/engineering/HowTo-SELinux/
    - https://lineageos.org/engineering/HowTo-Debugging/
- Some existing tools:
    - https://github.com/bkerler/edl
    - https://github.com/ssut/payload-dumper-go
    - https://github.com/Hagb/decryptBooxUpdateUpx
    - https://github.com/onyx-intl (limited and out of date, it looks like)
    - https://wiki.postmarketos.org/wiki/ONYX_BOOX_Go_6_(onyx-go6)
- and I know later on in this side project, I'll have to get real comfortable on [XDA forums](https://xdaforums.com)

<!-- bringups: https://blog.realogs.in/android-device-tree-bringup/ and https://gist.github.com/mvaisakh/1a45694e33584592e8fae37fe29d757d -->
<!-- ROMs: https://xdaforums.com/t/guide-complete-android-rom-development-from-source-to-end.2814763/ and https://xdaforums.com/t/guide-video-tutorial-how-to-build-custom-roms-and-kernels-10-p-o-n-m-l.3814251/ -->

## Rooting the Device

My first task is to root the device (generally following [existing](https://blog.tho.ms/hacks/2021/03/27/hacking-onyx-boox-note-air.html) [works](https://cake.moe/blog/rooting-boox-tab-ultra/), by Thomas Hollstegge and Mia respectively, working on different Boox devices).
This will provide far greater access on the device, as well as images of the current system partitions.

Onyx firmware is no longer listed online, so I needed to get the new update off my device itself.
My current build was `2024-10-24_10-59_3.5.4_2b800b967`, so I was able to re-open the Onyx Launcher I hadn't used in some time, and download the pending firmware update.
I transferred the build of `2025-06-18_14-27_4.0.2-rel_0614_35a32af51` to my workstation, and I was able to decrypt the firmware using the [Hagb/decryptBooxUpdateUpx](https://github.com/Hagb/decryptBooxUpdateUpx) repo:

```
python3 DeBooxUpx.py Go103 update.upx
```

The resulting directory is:

```
update.zip

📂 META-INF
  📂  com
    📂  android
      📄 metadata
      📄 metadata.pb
      📄 otacert
📄 apex_info.pb
📄 care_map.pb
📄 payload.bin
📄 payload_properties.txt
```

:::info
🤖 Gemini 2.5 Pro says:

Root Directory Files

These files are central to defining and applying the update.

- apex_info.pb: This protocol buffer file contains information about any APEX (Android Pony EXpress) files within the update. APEX is a container format used to deliver updatable, lower-level system modules. This file specifies the list of APEX files included in the payload.
- care_map.pb: This file is primarily associated with A/B (seamless) system updates. It contains information that helps the update engine determine how to apply the update to the inactive partition slot while the user's system continues to run on the active slot. It can also detail which partitions can be wiped or if a data wipe is required.
- payload.bin: This is the core of the update package. It's a binary file that contains the compressed images of the various system partitions to be updated, such as system, vendor, and boot. For A/B updates, this payload is streamed to the inactive partition and applied.
- payload_properties.txt: This text file contains properties and metadata about the payload.bin file. It includes information such as the payload's size, hash, and header details. This allows the system to verify the integrity of the payload before and during the update process.
:::

The payload can be split out into separate partition images using a tool like [ssut/payload-dumper-go](https://github.com/ssut/payload-dumper-go?tab=readme-ov-file), or using the open source EDL implementation to dump the existing partitions. Since we already have the payload, we can for now skip the headache with EDL (where we have to find an applicable loader file for this SoC). We run:
<!-- loaders: https://www.temblast.com/edl.htm and https://www.temblast.com/ref/loaders.htm -->

```
./payload-dumper-go payload.bin

ls -lh
total 3.8G
-rwxr-xr-x 1 clifford clifford 156K Jul  9 10:06 abl.img
-rwxr-xr-x 1 clifford clifford  96M Jul  9 10:06 boot.img
-rwxr-xr-x 1 clifford clifford 8.0M Jul  9 10:06 dtbo.img
-rwxr-xr-x 1 clifford clifford  35M Jul  9 10:06 modem.img
-rwxr-xr-x 1 clifford clifford 592M Jul  9 10:06 product.img
-rwxr-xr-x 1 clifford clifford  96M Jul  9 10:06 recovery.img
-rwxr-xr-x 1 clifford clifford 2.2G Jul  9 10:07 system.img
-rwxr-xr-x 1 clifford clifford 361M Jul  9 10:06 system_ext.img
-rwxr-xr-x 1 clifford clifford 8.0K Jul  9 10:06 vbmeta.img
-rwxr-xr-x 1 clifford clifford 4.0K Jul  9 10:06 vbmeta_system.img
-rwxr-xr-x 1 clifford clifford 480M Jul  9 10:06 vendor.img
-rwxr-xr-x 1 clifford clifford 3.1M Jul  9 10:06 xbl.img
```

So let's patch the boot image to prep for install of Magisk, apply the update in Onyx, and finally flash the new boot image.
Magisk easily patches the image to produce `magisk_patched-29000_F55YV.img`, but that's where the struggles begin.
Within fastboot, both `boot` and `flash` send the image to the device, but then finally return command not found.

Big set back here, I was hoping not to faff around with EDL and loaders and similar to start.
However, with those commands disabled there isn't another way to flash the boot image.
Time to setup EDL properly!
The EDL repo does some global system installation that I wasn't eager about; the udev rules make sense, but the system python dep installation isn't my favorite.
I got the EDL repo working after some trial and error:

```
sudo bash install-linux-edl-drivers.sh  # Required changes
uv venv -p 3.13                         # Setup an isolated environment
uv pip install -e .                     # Install the project deps in devmode
source .venv/bin/activate
./edl  --help                           # Test that the command works
```

I had some issues with getting `edl printgpt` to work, as there's no loader for SM6225 in the provided submodule, and while testing out various loaders suggested online my device became unresponsive to all EDL commands.
After holding down the power button for long periods until the device rebooted out of recovery mode, I was able to reboot to EDL again and [one of the loaders I had tried earlier](https://github.com/bkerler/Loaders/issues/97) (formerly with no luck) was now working!

```
edl --loader sm6225.bin printgpt
```

<details>
<summary>
Example Partition Output
</summary>

```plaintext
Qualcomm Sahara / Firehose Client V3.62 (c) B.Kerler 2018-2025.
main - Using loader sm6225.bin ...
main - Waiting for the device
main - Device detected :)
sahara - Protocol version: 2, Version supported: 1
main - Mode detected: sahara
sahara -
Version 0x2
------------------------
HWID:              0x################ (MSM_ID:0x########,OEM_ID:0x0000,MODEL_ID:0x0000)
CPU detected:      "divar"
PK_HASH:           0x################################################################################################
Serial:            0x########

sahara - Protocol version: 2, Version supported: 1
sahara - Uploading loader sm6225.bin ...
sahara - 64-Bit mode detected.
sahara - Firehose mode detected, uploading...
sahara - Loader successfully uploaded.
main - Trying to connect to firehose loader ...
firehose - INFO: Binary build date: Jan 10 2024 @ 18:16:46
firehose - INFO: Binary build date: Jan 10 2024 @ 18:16:46
firehose - INFO: Chip serial num: ######### (0x########)
firehose - INFO: Supported Functions (15):
firehose - INFO: program
firehose - INFO: read
firehose - INFO: nop
firehose - INFO: patch
firehose - INFO: configure
firehose - INFO: setbootablestoragedrive
firehose - INFO: erase
firehose - INFO: power
firehose - INFO: firmwarewrite
firehose - INFO: getstorageinfo
firehose - INFO: benchmark
firehose - INFO: emmc
firehose - INFO: ufs
firehose - INFO: fixgpt
firehose - INFO: getsha256digest
firehose - INFO: End of supported functions 15
firehose_client
firehose_client - [LIB]: No --memory option set, we assume "UFS" as default ..., if it fails, try using "--memory" with "UFS","NAND" or "spinor" instead !
firehose
firehose - [LIB]: Couldn't detect MaxPayloadSizeFromTargetinBytes
firehose
firehose - [LIB]: Couldn't detect TargetName
firehose - TargetName=Unknown
firehose - MemoryName=UFS
firehose - Version=1
firehose - Trying to read first storage sector...
firehose - Running configure...
firehose - Storage report:
firehose - total_blocks:14507008
firehose - block_size:4096
firehose - page_size:4096
firehose - num_physical:6
firehose - manufacturer_id:2597
firehose - serial_num:##########
firehose - fw_version:1.7
firehose - mem_type:UFS
firehose - prod_name:eUFS2.2_064
firehose_client - Supported functions:
-----------------
program,read,nop,patch,configure,setbootablestoragedrive,erase,power,firmwarewrite,getstorageinfo,benchmark,emmc,ufs,fixgpt,getsha256digest

Parsing Lun 0:

GPT Table:
-------------
ssd:                 Offset 0x0000000000006000, Length 0x0000000000002000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
persist:             Offset 0x0000000000008000, Length 0x0000000002000000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
misc:                Offset 0x0000000002008000, Length 0x0000000000100000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
keystore:            Offset 0x0000000002108000, Length 0x0000000000080000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
frp:                 Offset 0x0000000002188000, Length 0x0000000000080000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
super:               Offset 0x0000000002208000, Length 0x0000000100000000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
recovery_a:          Offset 0x0000000102208000, Length 0x0000000006000000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
recovery_b:          Offset 0x0000000108208000, Length 0x0000000006000000, Flags 0x1004000000000000, UUID ####################################, Type ##########, Active True
vbmeta_system_a:     Offset 0x000000010e208000, Length 0x0000000000010000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
vbmeta_system_b:     Offset 0x000000010e218000, Length 0x0000000000010000, Flags 0x1004000000000000, UUID ####################################, Type ##########, Active True
metadata:            Offset 0x000000010e228000, Length 0x0000000001000000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
onyxconfig:          Offset 0x000000010f228000, Length 0x0000000001800000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
userdata:            Offset 0x0000000110a28000, Length 0x0000000cc51d3000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False

Total disk size:0x0000000dd5c00000, sectors:0x0000000000dd5c00


Parsing Lun 1:

GPT Table:
-------------
xbl_a:               Offset 0x0000000000006000, Length 0x0000000000380000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
xbl_config_a:        Offset 0x0000000000386000, Length 0x0000000000020000, Flags 0x0040000000000000, UUID ####################################, Type ##########, Active False

Total disk size:0x0000000000800000, sectors:0x0000000000000800


Parsing Lun 2:

GPT Table:
-------------
xbl_b:               Offset 0x0000000000006000, Length 0x0000000000380000, Flags 0x10c4000000000000, UUID ####################################, Type ##########, Active True
xbl_config_b:        Offset 0x0000000000386000, Length 0x0000000000020000, Flags 0x00c4000000000000, UUID ####################################, Type ##########, Active True

Total disk size:0x0000000000800000, sectors:0x0000000000000800


Parsing Lun 3:

GPT Table:
-------------
ALIGN_TO_128K_1:     Offset 0x0000000000006000, Length 0x000000000001a000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
cdt:                 Offset 0x0000000000020000, Length 0x0000000000020000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
ddr:                 Offset 0x0000000000040000, Length 0x0000000000100000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False

Total disk size:0x0000000008000000, sectors:0x0000000000008000


Parsing Lun 4:

GPT Table:
-------------
rpm_a:               Offset 0x0000000000006000, Length 0x0000000000080000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
tz_a:                Offset 0x0000000000086000, Length 0x0000000000400000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
hyp_a:               Offset 0x0000000000486000, Length 0x0000000000080000, Flags 0x0040000000000000, UUID ####################################, Type ##########, Active False
modem_a:             Offset 0x0000000000506000, Length 0x000000000b400000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
bluetooth_a:         Offset 0x000000000b906000, Length 0x0000000000100000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
mdtpsecapp_a:        Offset 0x000000000ba06000, Length 0x0000000000400000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
mdtp_a:              Offset 0x000000000be06000, Length 0x0000000002000000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
abl_a:               Offset 0x000000000de06000, Length 0x0000000000100000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
dsp_a:               Offset 0x000000000df06000, Length 0x0000000002000000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
keymaster_a:         Offset 0x000000000ff06000, Length 0x0000000000080000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
boot_a:              Offset 0x000000000ff86000, Length 0x0000000006000000, Flags 0x0073000000000000, UUID ####################################, Type ##########, Active False
cmnlib_a:            Offset 0x0000000015f86000, Length 0x0000000000080000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
cmnlib64_a:          Offset 0x0000000016006000, Length 0x0000000000080000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
devcfg_a:            Offset 0x0000000016086000, Length 0x0000000000020000, Flags 0x0040000000000000, UUID ####################################, Type ##########, Active False
qupfw_a:             Offset 0x00000000160a6000, Length 0x0000000000010000, Flags 0x0040000000000000, UUID ####################################, Type ##########, Active False
vbmeta_a:            Offset 0x00000000160b6000, Length 0x0000000000010000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
dtbo_a:              Offset 0x00000000160c6000, Length 0x0000000001800000, Flags 0x0040000000000000, UUID ####################################, Type ##########, Active False
imagefv_a:           Offset 0x00000000178c6000, Length 0x0000000000200000, Flags 0x0040000000000001, UUID ####################################, Type ##########, Active False
uefisecapp_a:        Offset 0x0000000017ac6000, Length 0x0000000000200000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
featenabler_a:       Offset 0x0000000017cc6000, Length 0x0000000000020000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
multiimgoem_a:       Offset 0x0000000017ce6000, Length 0x0000000000008000, Flags 0x1040000000000000, UUID ####################################, Type ##########, Active False
rpm_b:               Offset 0x0000000017cee000, Length 0x0000000000080000, Flags 0x007f000000000000, UUID ####################################, Type #########, Active True
tz_b:                Offset 0x0000000017d6e000, Length 0x0000000000400000, Flags 0x007f000000000000, UUID ####################################, Type ##########, Active True
hyp_b:               Offset 0x000000001816e000, Length 0x0000000000080000, Flags 0x007f000000000000, UUID ####################################, Type ##########, Active True
modem_b:             Offset 0x00000000181ee000, Length 0x000000000b400000, Flags 0x107f000000000000, UUID ####################################, Type ##############, Active True
bluetooth_b:         Offset 0x00000000235ee000, Length 0x0000000000100000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
mdtpsecapp_b:        Offset 0x00000000236ee000, Length 0x0000000000400000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
mdtp_b:              Offset 0x0000000023aee000, Length 0x0000000002000000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
abl_b:               Offset 0x0000000025aee000, Length 0x0000000000100000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
dsp_b:               Offset 0x0000000025bee000, Length 0x0000000002000000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
keymaster_b:         Offset 0x0000000027bee000, Length 0x0000000000080000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
boot_b:              Offset 0x0000000027c6e000, Length 0x0000000006000000, Flags 0x0077000000000000, UUID ####################################, Type ##########, Active True
cmnlib_b:            Offset 0x000000002dc6e000, Length 0x0000000000080000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
cmnlib64_b:          Offset 0x000000002dcee000, Length 0x0000000000080000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
devcfg_b:            Offset 0x000000002dd6e000, Length 0x0000000000020000, Flags 0x007f000000000000, UUID ####################################, Type ##########, Active True
qupfw_b:             Offset 0x000000002dd8e000, Length 0x0000000000010000, Flags 0x007f000000000000, UUID ####################################, Type ##########, Active True
vbmeta_b:            Offset 0x000000002dd9e000, Length 0x0000000000010000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
dtbo_b:              Offset 0x000000002ddae000, Length 0x0000000001800000, Flags 0x007f000000000000, UUID ####################################, Type ##########, Active True
featenabler_b:       Offset 0x000000002f5ae000, Length 0x0000000000020000, Flags 0x0004000000000000, UUID ####################################, Type ##########, Active True
imagefv_b:           Offset 0x000000002f5ce000, Length 0x0000000000200000, Flags 0x007f000000000001, UUID ####################################, Type ##########, Active True
uefisecapp_b:        Offset 0x000000002f7ce000, Length 0x0000000000200000, Flags 0x0004000000000000, UUID ####################################, Type ##########, Active True
multiimgoem_b:       Offset 0x000000002f9ce000, Length 0x0000000000008000, Flags 0x107f000000000000, UUID ####################################, Type ##########, Active True
devinfo:             Offset 0x000000002f9d6000, Length 0x0000000000001000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
dip:                 Offset 0x000000002f9d7000, Length 0x0000000000100000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
apdp:                Offset 0x000000002fad7000, Length 0x0000000000040000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
spunvm:              Offset 0x000000002fb17000, Length 0x0000000000800000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
splash:              Offset 0x0000000030317000, Length 0x00000000020a4000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
limits:              Offset 0x00000000323bb000, Length 0x0000000000001000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
toolsfv:             Offset 0x00000000323bc000, Length 0x0000000000100000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
logfs:               Offset 0x00000000324bc000, Length 0x0000000000800000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
cateloader:          Offset 0x0000000032cbc000, Length 0x0000000000200000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
rawdump:             Offset 0x0000000032ebc000, Length 0x0000000008000000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
logdump:             Offset 0x000000003aebc000, Length 0x0000000004000000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
storsec:             Offset 0x000000003eebc000, Length 0x0000000000020000, Flags 0x1000000000000000, UUID ####################################, Type #########, Active False
multiimgqti:         Offset 0x000000003eedc000, Length 0x0000000000008000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
uefivarstore:        Offset 0x000000003eee4000, Length 0x0000000000080000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
secdata:             Offset 0x000000003ef64000, Length 0x0000000000007000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
catefv:              Offset 0x000000003ef6b000, Length 0x0000000000080000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
catecontentfv:       Offset 0x000000003efeb000, Length 0x0000000000100000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False

Total disk size:0x0000000100000000, sectors:0x0000000000100000


Parsing Lun 5:

GPT Table:
-------------
ALIGN_TO_128K_2:     Offset 0x0000000000006000, Length 0x000000000001a000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
modemst1:            Offset 0x0000000000020000, Length 0x0000000000200000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False
modemst2:            Offset 0x0000000000220000, Length 0x0000000000200000, Flags 0x0000000000000000, UUID ####################################, Type #########, Active False
fsg:                 Offset 0x0000000000420000, Length 0x0000000000200000, Flags 0x1000000000000000, UUID ####################################, Type ##########, Active False
fsc:                 Offset 0x0000000000620000, Length 0x0000000000020000, Flags 0x0000000000000000, UUID ####################################, Type ##########, Active False

Total disk size:0x0000000008000000, sectors:0x0000000000008000
```

</details>

From here, we just read out all the requisite images for us to patch:

```
mkdir extracted_edl_20250809
cd extracted_edl_20250809
edl --loader sm6225.bin r boot_a,boot_b,vbmeta_a,vbmeta_b boot_a.img,boot_b.img,vbmeta_a.img,vbmeta_b.img
edl reset
```

Then after the device as rebooted, we can copy `boot_a.img` and `boot_b.img` into the device, disconnect from the computer, and follow the Magisk patching instructions.

:::warning
From here it's important to NOT confuse the two partitions in the output files!

I renamed each Magisk patched output as it was produced, to prefix the partition: `boot_a_magisk_patched-29000_IsHAi.img` and `boot_b_magisk_patched-29000_2zita.img`
:::

Finally, in order to use the patched boot images, we can set relevant flags in the VBMeta (verified boot metadata) images by [using this script](https://github.com/zoomver/Vbmeta) to modify them in place:

```
python patch-vbmeta.py vbmeta_a.img
python patch-vbmeta.py vbmeta_b.img
```

Finally, we need to flash these all back to the device, so back to EDL mode we go!

```
adb reboot edl
edl --loader sm6225.bin w boot_a extracted_edl_20250809/boot_a_magisk_patched-29000_IsHAi.img
edl --loader sm6225.bin w boot_b extracted_edl_20250809/boot_b_magisk_patched-29000_2zita.img
edl --loader sm6225.bin w vbmeta_a extracted_edl_20250809/vbmeta_a.img
edl --loader sm6225.bin w vbmeta_b extracted_edl_20250809/vbmeta_b.img
edl reset
```

And upon reboot, Magisk confirms the rooted image was booted successfully.

Additional resources used:

## System Modifications

At this point, to make the device a bit more trusted I worked through the following steps:

- Add a Magisk DenyList, blocking almost all apps for su access
- AFWall+, blocking all Onyx apps from network traffic
- Disable Onyx apps via `adb shell pm clear $PKG_NAME && adb shell pm disable-user $PKG_NAME`
- Neo Backup for all apps
- Remove Onyx apps via `adb shell pm uninstall --user 0 $PKG_NAME`

And for reference, at the time of writing it appears that the tablet ships with the following Boox-modified apps:

- `com.android.quicksearchbox`
- `org.chromium.chrome`
- every "onyx" app

<details>
<summary>
`adb shell pm list packages | grep onyx`
</summary>

```
package:com.android.internal.systemui.navbar.gestural_onyx
package:com.onyx.dict
package:com.onyx.kime
package:com.onyx.mail
package:com.onyx.android.onyxotaservice
package:com.onyx.clock
package:com.onyx.igetshop
package:com.onyx.android.production.test
package:com.onyx.latinime
package:com.onyx.musicplayer
package:com.onyx.android.ksync
package:com.onyx
package:com.onyx.easytransfer
package:com.onyx.kreader
package:com.onyx.android.note
package:com.onyx.gallery
package:com.onyx.floatingbutton
package:com.onyx.tscalibration
package:com.onyx.aiassistant
package:com.onyx.voicerecorder
package:com.onyx.appmarket
package:com.onyx.calculator
```

</details>

Of course there are several, deeper modifications made within the Boox ROM, given many of the UI elements that are still present (such as the overriden utility dropdown, the E Ink specific app configuration, and the lock screen).
But that's a good start, and opens up much deeper system access!
