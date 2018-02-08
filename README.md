## DVG Asset Sync

Script to download and check DVG files. If you don't know what this is, you don't need it.

First ensure you have Node 8 or higher installed:

`node -v`

Then install this globally as follows:

`npm install -g https://github.com/aerian-studios/dvg-asset-sync`

You can then run the script via the command `dvg-asset-sync`

There are some required parameters:

```
  --config, -c    Config file (update_profile.json)                   [required]
  --dir, -d       Target directory for files                          [required]
  --saveJSON, -j  Filename to save the new JSON if successful
  ```

- `--config` or `-c` 
Config file is the `update_profile.json`. This specifies where the assets and JSON are loaded from. It looks for `cloudURL` to find the JSON and `cloudRoot` for the root directory to load the assets.
- `--dir` or `-d`
Target directory is the web server's document root, or the subdirectory holding the assets. The assets will be downloaded and synced with this directory, so ensure that the script is run as a user with write access to this directory.
- `--saveJSON` or `-j`
If specified, the downloaded JSON file will be saved here once all of the assets have been downloaded and verified. This should probably in the document root of the webserver, so that the clients can download it.

## Development
This is written in TypeScript, and is compiled to JavaScript for distribution. Don't edit the .js files in /dist: they'll be overwritten by the TS compiler. Run `yarn watch` to run the compiler in watch mode.