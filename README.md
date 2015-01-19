Jagged Path
===========

An in-browser 2D exploration RPG in early development. Inspired by *A Dark Room's "Dusty Path"*, *RuneScape* and *Star Sonata* but originally started as a demo for a section of another game. Jagged Path is a client based browser game written in JavaScript.

Currently there isn't much to do in the game, but it's in a playable state and can be played [here](http://jagged-path.jbobbo.net/).


More info to come


Setting up on local (for development or just to play)
------

Because of the safety restrictions imposed in XMLHttpRequest, *Jagged Path* can't be run over the file:// protocol. As such it requires a webserver (or somehow disabling these checks)

Personal recommended steps (ubuntu specific):
1. Clone the repo: ```bash git clone https://github.com/JeffBobbo/JaggedPath.git```
2. Install a webserver: ```bash sudo apt-get install apache2```
...* Optinally install jsdoc at this time for documentation generation: ```bash sudo apt-get install apache2 jsdoc-toolkit```
3. Create a symlink to webserver: ```bash cd /var/www && sudo ln -s /home/$USER/JaggedPath/src jp```
...* In recent apache installations, /var/www gets a html directory, and it doens't seem to work, so check apache config
4. Navigate to [localhost/jp] in your browser

License
------

Due to the current landmine nature of software licenses (like, really, ugh). All the files written by me are simply all rights reserved. The HTML page, the CSS and each JavaScript file show this. JSON files don't allow for comments but are under the same restriction for now.

The only two files exempt from this is *[lz-string.js](https://github.com/pieroxy/lz-string)* and *[perlin.js](https://github.com/josephg/noisejs/)*, which are WTFPL and Public Domain respectively.
