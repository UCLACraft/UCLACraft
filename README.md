# UCLACraft

A scene editor. It allows users to place blocks to the scene.

## Quick Start

There are three states you can be in:

- PLACING: where you place a block with chosen texture to anywhere you like.
- MODIFYING: where you select existing blocks and modify their textures or delete them.
- COPYING: where you copy the selected existing blocks and copy them to anywhere you like. 

### PLACING State

- Clicking the mouse when you see the outline will create a block of the chosen texture.
- Press buttons to change textures.
- Press Enter to switch to MODIFYING State.

### MODIFYING State

- Click existing blocks to select blocks
- Click them again to unselect blocks
- Press Buttons to change textures
- Press Backspace to delete selected blocks
- Press Enter to switch back to PLACING State
- Press Ctrl-C to Switch to COPYING State if there are selected blocks

### COPYING State

- Similar to PLACING State, but with multiple blocks.
- Press Ctrl-C to Switch to MODYFYING State.



Have Fun!

Created By Team UCLACraft for CS174A Spring 2021 final project.

Advanced Features:

- Mouse Picking (Ray Casting)
- Shadowing (Multi-pass rendering)
- Scene Graphs (Multi-object data structures)
- 



