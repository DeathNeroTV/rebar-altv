export const CharacterSelectEvents = {
    toServer: {
        submitUsername: 'character:select:submit:username',
        trashCharacter: 'character:select:trash',
        spawnCharacter: 'character:select:spawn',
        logoutCharacter: 'character:select:logout',
        selectCharacter: 'character:select:identify'
    },
    toClient: {
        handleError: 'character:select:username:handle:error',
        populateCharacters: 'character:select:populate',
        toggleControls: 'character:select:toggle:controls',
        focusCamera: 'character:select:camera:focus',
        fadeOutCamera: 'character:select:camera:fadeOut',
        startCamera: 'character:select:camera:start'
    },
};