import * as alt from 'alt-client';
import * as native from 'natives';
import { useWebview } from '@Client/webview/index.js';
import { Commands } from '@Client/system/consoleCommand.js';
import { CharacterSelectEvents } from '../shared/characterSelectEvents.js';
import { Appearance } from '@Shared/types/appearance.js';
import { Character } from '@Shared/types/character.js';

const view = useWebview();

Commands['relog'] = () => alt.emitServer(CharacterSelectEvents.toServer.logoutCharacter);

const models = ['mp_f_freemode_01', 'mp_m_freemode_01'];
let peds: { [key: string]: number } = {};
let cam: number | null = null;
let camActive = false;

alt.onServer(CharacterSelectEvents.toClient.populateCharacters, async (characters: Partial<Character>[], maxChars: number) => {
    const localPlayer = alt.Player.local;
    for (const char of characters) {
        const gender = char.appearance?.sex ?? 1;
        const modelName = models[gender];

        await alt.Utils.requestModel(modelName, 10000);

        const ped = new alt.LocalPed(modelName, localPlayer.dimension, char.pos, char.rot);
    
        if (!ped || ped.scriptID === 0) {
            alt.logError(`Konnte LocalPed für ${char._id} nicht erstellen.`);
            continue;
        }

        ped.dimension = localPlayer.dimension;
        ped.pos = new alt.Vector3(char.pos);
        ped.rot = new alt.Vector3(char.rot);
        ped.frozen = true;

        native.taskStandStill(ped.scriptID, -1);
        native.setBlockingOfNonTemporaryEvents(ped.scriptID, true);

        if (char.appearance) {
            const app: Partial<Appearance> = char.appearance;

            // --- HeadBlend ---
            native.setPedHeadBlendData(
                ped,
                app.faceFather,
                app.faceMother,
                0, // Skin father/mother blend for now
                app.skinFather,
                app.skinMother,
                0,
                app.faceMix,
                app.skinMix,
                0,
                false
            );

            // --- Face Structure ---
            app.structure.forEach((value, index) => native.setPedMicroMorph(ped.scriptID, index, value));

            // --- Hair ---
            native.setPedHairTint(ped.scriptID, app.hairColor1, app.hairColor2);
            native.setPedComponentVariation(ped.scriptID, 2, app.hair, 0, 0); // 2 = Haare, DLC nicht direkt hier
            if (app.hairOverlay) native.addPedDecorationFromHashes(
                ped.scriptID, 
                alt.hash(app.hairOverlay.collection), 
                alt.hash(app.hairOverlay.overlay)
            );

            // --- Facial Hair ---
            native.setPedHeadOverlay(ped.scriptID, 1, app.facialHair, app.facialHairOpacity); // 1 = beard
            native.setPedHeadOverlayTint(ped.scriptID, 1, 1, app.facialHairColor1, 0);

            // --- Eyebrows ---
            native.setPedHeadOverlay(ped.scriptID, 2, app.eyebrows, app.eyebrowsOpacity);
            native.setPedHeadOverlayTint(ped.scriptID, 2, 1, app.eyebrowsColor1, 0);

            // --- Chest Hair ---
            native.setPedHeadOverlay(ped.scriptID, 10, app.chestHair, app.chestHairOpacity);
            native.setPedHeadOverlayTint(ped.scriptID, 10, 1, app.chestHairColor1, 0);

            // --- Eyes ---
            native.setHeadBlendEyeColor(ped.scriptID, app.eyes);

            // Optional: FacialHair, ChestHair, Eyebrows
            native.setPedHeadOverlay(ped.scriptID, 1, app.facialHair, app.facialHairOpacity);
            native.setPedHeadOverlayTint(ped.scriptID, 1, 1, app.facialHairColor1, 0);

            native.setPedHeadOverlay(ped.scriptID, 10, app.eyebrows, app.eyebrowsOpacity);
            native.setPedHeadOverlayTint(ped.scriptID, 2, 1, app.eyebrowsColor1, 0);

            native.setPedHeadOverlay(ped.scriptID, 11, app.chestHair, app.chestHairOpacity);
            native.setPedHeadOverlayTint(ped.scriptID, 3, 1, app.chestHairColor1, 0);

            // --- Tattoos ---
            if (app.tattoos) {
                app.tattoos.forEach(tat => native.addPedDecorationFromHashes(ped.scriptID, alt.hash(tat.collection), alt.hash(tat.overlay)));
            }

            // --- Kleidung / Props ---
            if (char.clothing) {
                for (let i = 0; i < char.clothing.length; i++) {
                    const comp = char.clothing[i];
                    if (comp.isProp) alt.setPedDlcProp(ped.scriptID, comp.dlc, comp.id, comp.drawable, comp.texture) //native.setPedPropIndex(ped, comp.id, comp.drawable, comp.texture, true, undefined);
                    else alt.setPedDlcClothes(ped.scriptID, comp.dlc, comp.id, comp.drawable, comp.texture);
                }
            }
        } 

        peds[char._id] = ped.scriptID;
        alt.log(`CharacterSelect → Ped [${char._id}] = ${ped.scriptID}`);
    }

    view.show('CharacterSelect', 'page');
    view.emit('charselect:characters', characters, maxChars);
});

alt.onServer(CharacterSelectEvents.toClient.focusCamera, (charId: string) => {
    if (!peds[charId]) {
        alt.logError('CharacterSelect: focusCamera - Ped nicht gefunden', charId);
        return;
    }

    setCharacterCamera(peds[charId]);
});

alt.onServer(CharacterSelectEvents.toClient.fadeOutCamera, () => {
    native.doScreenFadeOut(1000);
    destroyCharacterCamera();

    alt.setTimeout(() => {
        for (const pedId in peds) {
            native.deletePed(peds[pedId]);
        }
        peds = {};
        alt.setTimeout(() => native.doScreenFadeIn(800), 1200);
    }, 1000);
});

function setCharacterCamera(targetPed: number) {
    if (!native.doesEntityExist(targetPed)) return;

    const pedPos = native.getEntityCoords(targetPed, true);

    // --- Kamera-Ziel (Endposition) ---
    const targetPos = native.getOffsetFromEntityInWorldCoords(targetPed, 1.3, 1.3, 0.6);

    // --- Start (Himmels-)Position ---
    const skyPos = {
        x: pedPos.x,
        y: pedPos.y,
        z: pedPos.z + 30.0 // Kamera fährt hoch über den Charakter
    };

    // Falls Kamera noch nicht existiert: erstelle eine neue
    if (!camActive) {
        cam = native.createCamWithParams(
            'DEFAULT_SCRIPTED_CAMERA',
            skyPos.x,
            skyPos.y,
            skyPos.z,
            -90.0,
            0.0,
            0.0,
            50.0,
            true,
            0
        );

        native.pointCamAtCoord(cam, pedPos.x, pedPos.y, pedPos.z + 0.5);
        native.setCamActive(cam, true);
        native.renderScriptCams(true, true, 1500, true, false, 0);

        // Sanft auf Charakter herunterfahren
        alt.setTimeout(() => {
            const descendCam = native.createCamWithParams(
                'DEFAULT_SCRIPTED_CAMERA',
                targetPos.x,
                targetPos.y,
                targetPos.z,
                0.0,
                0.0,
                0.0,
                60.0,
                true,
                0
            );

            native.pointCamAtEntity(descendCam, targetPed, 0, 0, 0, true);
            native.setCamActiveWithInterp(descendCam, cam!, 2000, 1, 1);

            alt.setTimeout(() => {
                if (cam && native.doesCamExist(cam)) native.destroyCam(cam, false);
                cam = descendCam;
            }, 2200);
        }, 400);

        camActive = true;
        return;
    }

    // --- Wenn Kamera bereits existiert: "rausfahren", dann reinfahren ---
    const skyCam = native.createCamWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        skyPos.x,
        skyPos.y,
        skyPos.z,
        -90.0,
        0.0,
        0.0,
        50.0,
        true,
        0
    );

    native.pointCamAtCoord(skyCam, pedPos.x, pedPos.y, pedPos.z);
    native.setCamActiveWithInterp(skyCam, cam!, 1200, 1, 1);

    alt.setTimeout(() => {
        const descendCam = native.createCamWithParams(
            'DEFAULT_SCRIPTED_CAMERA',
            targetPos.x,
            targetPos.y,
            targetPos.z,
            0.0,
            0.0,
            0.0,
            60.0,
            true,
            0
        );

        native.pointCamAtEntity(descendCam, targetPed, 0, 0, 0, true);
        native.setCamActiveWithInterp(descendCam, skyCam, 1800, 1, 1);

        // Alte Kamera nach Interpolation zerstören
        alt.setTimeout(() => {
            if (cam && native.doesCamExist(cam)) native.destroyCam(cam, false);
            if (skyCam && native.doesCamExist(skyCam)) native.destroyCam(skyCam, false);
            cam = descendCam;
        }, 2000);
    }, 1300);
}

function destroyCharacterCamera() {
    if (camActive && cam !== null) {
        native.renderScriptCams(false, true, 1000, true, false, 0);
        native.destroyCam(cam, false);
        cam = null;
        camActive = false;
    }
}