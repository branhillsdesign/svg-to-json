#!/usr/bin/env node

import * as fs from "fs";
import * as cheerio from "cheerio";
import path from "path";
import * as p from "@clack/prompts";
import picocolors from "picocolors";

async function main() {
	console.clear();

	p.intro(`${picocolors.white("SVG to JSON Converter")}`);

	const directoryPath = await p.text({
		message: "Where are your icons located?",
	});

	const outputFileName = await p.text({
		message: "What should we name your icon set?",
	});

	const replVar = await p.confirm({
		message: `Would you like to replace any colors with variables?`,
	});
	let colorsRepeat = false;
	let replCount = 0;
	let replArr = [];
	if (replVar === true) {
		do {
			const colors = await p.group({
				fColor: () => p.text({ message: "Type in the color to be replaced" }),
				rColor: ({ results }) =>
					p.text({
						message: `What color should we replace ${picocolors.cyan(
							results.fColor
						)} with?`,
					}),
				re: () => p.confirm({ message: "Replace another color?" }),
			});
			replArr.push({
				replCount: { fColor: colors.fColor, rColor: colors.rColor },
			});
			replCount++;
			console.log(replArr);
			colorsRepeat = colors.re;
			if (colors.fColor || colors.rColor === undefined) {
				throw new Error("Error code 1: Undefined entry");
			}
		} while (colorsRepeat === true);
	}

	const outputFilePath = outputFileName + ".json";
	const branicons = {};

	fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
		if (err) {
			console.error("Error reading directory", err);
			return;
		}
		let filesProcessed = 0;
		// Get paths from svg, replace text, dump into JSON file
		files.forEach((dirent) => {
			const filePath = path.join(directoryPath, dirent.name);
			fs.stat(filePath, (err, stats) => {
				if (err) {
					console.error("Error getting file stats:", err);
					return;
				}
				if (dirent.isFile()) {
					const pathStringsArray = [];
					const svgFileName = path.basename(filePath, ".svg");
					const buffer = fs.readFileSync(filePath);
					const $ = cheerio.load(buffer, null, false);

					// Get all attributes from SVG
					$("path").each(function () {
						const d = $(this).attr();
						pathStringsArray.push(d);
					});
					
					if (replVar) {
						const repl = JSON.stringify({ ...pathStringsArray });
						replArr.forEach((e, index) => {
							console.log("Replacing " + index);
							repl.replace(replArr.fColor, replArr.rColor);
							return;
						});
						const replPathStringsArray = JSON.parse();
						// Grouping the items together under the icon name
						branicons[svgFileName] = { ...replPathStringsArray };
					} else {
						// Grouping the items together under the icon name
						branicons[svgFileName] = { ...pathStringsArray };
					}
					// console.log("NEW:", filePath);
					filesProcessed++;

					if (filesProcessed === files.length) {
						writeJsonFile();
					}
				} else if (dirent.isDirectory()) {
					p.text("Directory found:", filePath);
					// Recursively call readdir if it's a directory
				}
			});
		});
	});

	// Writes the file to disk
	function writeJsonFile() {
		fs.writeFileSync(outputFilePath, JSON.stringify(branicons, null, 2));
		// console.log('JSON data written to file:', outputFilePath);
	}
	p.outro(
		`Icon set completed. You can find it here: ${picocolors.cyan(
			outputFilePath
		)}`
	);
}

main();
