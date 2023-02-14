// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import {
    AUTO_SAVE_KEY,
    DISABLED_KEY,
    DISABLE_AUTO_SAVE,
    ENABLE_AUTO_SAVE,
    GLOBAL,
} from "./constants";
import { isSubPath } from "./helpers";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
const getFolder = (): string | null => {
    if (vscode.window.activeTextEditor === undefined) {
        const potentialFolder = vscode.workspace.workspaceFolders?.map(
            (folder) => folder.uri.path
        );
        if (potentialFolder && potentialFolder?.length > 0) {
            return potentialFolder[0];
        }
        vscode.window.showErrorMessage("No active window found!");
        return null;
    }
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        vscode.window.activeTextEditor.document.uri
    );
    return workspaceFolder?.uri.path || null;
};
const getCurrentDisabledFolders = (): string[] => {
    const localConfig = vscode.workspace.getConfiguration("cond-autosave");
    const currentState = localConfig.get("disabledFolders") as [];
    return currentState;
};

const toggleAutosave = (enable: boolean) => {
    const config = vscode.workspace.getConfiguration();
    if (enable) {
        config.update(AUTO_SAVE_KEY, ENABLE_AUTO_SAVE, GLOBAL, true);
    } else {
        config.update(AUTO_SAVE_KEY, DISABLE_AUTO_SAVE, GLOBAL, true);
    }
};
const shouldDisable = (): boolean => {
    const currentFolder: string = getFolder() ?? "";
    const currentDisabled: string[] = getCurrentDisabledFolders();
    console.log("current disabled", currentDisabled, currentFolder);
    const item = currentDisabled.some((path) => isSubPath(path, currentFolder));
    console.log("should disable", item);
    for (const item2 of currentDisabled) {
        console.log(
            "current",
            currentFolder,
            item2,
            isSubPath(item2, currentFolder)
        );
    }
    return item;
};
/**
 * Disables autosave based on current working folder is registered as disabled.
 * @return Whether autosave has been disabled.
 */
const toggleIfInFolder = () => {
    if (!shouldDisable()) {
        toggleAutosave(true);
        return false;
    }
    // We should disable autosave here.
    toggleAutosave(false);
};
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    let currentFolder = getFolder();

    console.log("Cond-autosave is currently active!");
    const localConfig = vscode.workspace.getConfiguration("cond-autosave");
    toggleIfInFolder();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json

    const addFolder = vscode.commands.registerCommand(
        "cond-autosave.addFolder",
        () => {
            if (!currentFolder) {
                return;
            }
            const currentState = localConfig.get("disabledFolders") as string[];
            console.log("current state = ", currentState);

            localConfig.update(
                "disabledFolders",
                [...new Set([...currentState, currentFolder])],
                GLOBAL,
                true
            );
        }
    );
    const removeFolder = vscode.commands.registerCommand(
        "cond-autosave.removeFolder",
        () => {
            if (!currentFolder) {
                return;
            }
            const currentDisabled = getCurrentDisabledFolders();
            if (currentDisabled.includes(currentFolder)) {
                localConfig.update(
                    "disabledFolders",
                    [
                        ...new Set([
                            ...currentDisabled.filter(
                                (item) => item !== currentFolder
                            ),
                        ]),
                    ],
                    GLOBAL,
                    true
                );
            }
        }
    );

    const checkIfChanged = vscode.workspace.onDidChangeConfiguration((e) => {
        // Our settings have been changed.
        if (e.affectsConfiguration("cond-autosave.disabledFolders")) {
            console.log("settings changed", e);
            toggleIfInFolder();
        }
    });
    // We watch for changed folders
    const checkWindowChange = vscode.window.onDidChangeActiveTextEditor(() => {
        console.log(
            "WINDOW HAS CHANGED!!!!",
            vscode.workspace.workspaceFolders
        );
        if (!shouldDisable()) {
            toggleAutosave(true);
        }
    });

    context.subscriptions.push(addFolder);
    context.subscriptions.push(removeFolder);
    context.subscriptions.push(checkIfChanged);
    context.subscriptions.push(checkWindowChange);
}

// This method is called when your extension is deactivated
export function deactivate() {}
