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

	const replVariables = await p.confirm({
		message: `Would you like to replace any colors with variables?`,
	});
	const colors = replVariables
		? await p.group(
				{
					fColor: () => p.text({ message: "Type in the color to be replaced" }),
					rColor: ({ results }) =>
						p.text({
							message: `What color should we replace ${picocolors.cyan(
								results.fColor
							)} with?`,
						}),
				},
				{
					// On Cancel callback that wraps the group
					// So if the user cancels one of the prompts in the group this function will be called
					onCancel: ({ results }) => {
						p.cancel("Operation cancelled.");
						process.exit(0);
					},
				}
		  )
		: null;

	const outputFilePath = outputFileName + ".json";

	const branicons = {};

	fs.readdir(directoryPath, (err, files) => {
		if (err) {
			console.error("Error reading directory", err);
			return;
		}

		let filesProcessed = 0;
		// Get paths from svg, replace text, dump into JSON file
		files.forEach((file) => {
			const filePath = path.join(directoryPath, file);
			fs.stat(filePath, (err, stats) => {
				if (err) {
					console.error("Error getting file stats:", err);
					return;
				}
				if (stats.isFile()) {
					const svgFileName = path.basename(filePath, ".svg");
					const pathStringsArray = [];

					const buffer = fs.readFileSync(filePath);
					const $ = cheerio.load(buffer, null, false);

					// Get all attributes from paths
					$("path").each(function () {
						const d = $(this).attr();
						pathStringsArray.push(d);
					});

					// Find and replace
					if (replVariables) {
						var replPathStringsArray = JSON.stringify(...pathStringsArray);
						var replPathStringsArray = replPathStringsArray.replace(
							colors.fColor,
							colors.rColor
						);
						var replPathStringsArray = JSON.parse(replPathStringsArray);
					}
					
					// Grouping the items together under the icon name
					branicons[svgFileName] = replVariables ? { ...replPathStringsArray } : {...pathStringsArray};
					// console.log("NEW:", filePath);
					filesProcessed++;

					if (filesProcessed === files.length) {
						writeJsonFile();
					}
				} else if (stats.isDirectory()) {
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
