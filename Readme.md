# Online Craftguide (`online_craftguide`)

Generates a static ("serverless") online craftguide.

## About

See this [Minetest Game craftguide](https://appgurueu.github.io/online_craftguide/) for an example.
Depends on [`modlib`](https://github.com/appgurueu/modlib). Requires inventory images rendered using [`online_craftguide_csm`](https://github.com/appgurueu/modlib) to work (which are not copied automatically). Code written by Lars Mueller aka LMD or appguru(eu) and licensed under the MIT license. The Minetest logo is licensed as CC BY-SA 3.0 with credits going to erlehmann. Generated inventory images (files in the `docs/images` folder) are derived from [Minetest Game](https://github.com/minetest/minetest_game) and therefore CC BY-SA 3.0, with credits going to [various contributors](https://github.com/minetest/minetest_game/blob/master/LICENSE.txt). Uses & embeds [Bootstrap icons](https://icons.getbootstrap.com) which are licensed under the MIT license, with credits going to [mdo](https://github.com/mdo).

## Links

* [GitHub](https://github.com/appgurueu/online_craftguide) - sources, issue tracking, contributing
* [Discord](https://discordapp.com/invite/ysP74by) - discussion, chatting
* [Minetest Forum](https://forum.minetest.net/viewtopic.php?f=9&t=24945) - (more organized) discussion
* [ContentDB](https://content.minetest.net/packages/LMD/online_craftguide) - releases (cloning from GitHub is recommended)

## Features

* Responsive website using Bootstrap
* Good layout & design
* Search

## Instructions

* Install [`modlib`](https://github.com/appgurueu/modlib) and this mod as well as the [`online_craftguide_csm`](https://github.com/appgurueu/modlib)
* Join a game with the `online_craftguide_csm` and wait for the rendering to finish
* Copy the `online_craftguide_csm/images` folder to your `online_craftguide/docs/images` folder
* Start a game with the mod enabled - it will generate the website for you
* Your online craftguide is now stored in your `online_craftguide/docs` folder