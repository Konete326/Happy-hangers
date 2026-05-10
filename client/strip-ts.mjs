import fs from 'fs';
import path from 'path';
import { transformSync } from '@babel/core';

// The directories to copy
const directories = [
    { src: '../material-shadcn-1.0.0/client/src/pages', dest: './src/pages' },
    { src: '../material-shadcn-1.0.0/client/src/components/layout', dest: './src/layouts' },
    { src: '../material-shadcn-1.0.0/client/src/components/dashboard', dest: './src/components/dashboard' },
    { src: '../material-shadcn-1.0.0/client/src/components/theme-configurator.tsx', dest: './src/components/theme-configurator.jsx', file: true }
];

function processDir(srcPath, destPath) {
    if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
    }

    const entries = fs.readdirSync(srcPath, { withFileTypes: true });

    for (let entry of entries) {
        const srcFile = path.join(srcPath, entry.name);
        const isTsx = entry.name.endsWith('.tsx');
        const isTs = entry.name.endsWith('.ts');

        if (entry.isDirectory()) {
            processDir(srcFile, path.join(destPath, entry.name));
        } else if (isTsx || isTs) {
            processFile(srcFile, path.join(destPath, entry.name.replace(/\.tsx?$/, isTsx ? '.jsx' : '.js')));
        } else {
            fs.copyFileSync(srcFile, path.join(destPath, entry.name));
        }
    }
}

function processFile(srcFile, destFile) {
    const code = fs.readFileSync(srcFile, 'utf-8');
    try {
        const result = transformSync(code, {
            filename: srcFile,
            presets: [
                ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]
            ],
            retainLines: true,
            generatorOpts: { jsescOption: { minimal: true } }
        });
        // Remove wouter imports and ensure React router if needed, but for now just strip TS
        let finalCode = result.code;
        // Replace wouter with react-router-dom
        finalCode = finalCode.replace(/from\s+["']wouter["']/g, 'from "react-router-dom"');

        fs.writeFileSync(destFile, finalCode);
        console.log(`Transpiled: ${destFile}`);
    } catch (err) {
        console.error(`Error transpiling ${srcFile}:`, err);
    }
}

directories.forEach(item => {
    if (item.file) {
        processFile(item.src, item.dest);
    } else {
        processDir(item.src, item.dest);
    }
});
