-- These are the basic's for using wezterm.
-- Mux is the mutliplexes for windows etc inside of the terminal
-- Action is to perform actions on the terminal
local wezterm = require 'wezterm'
local mux = wezterm.mux
local act = wezterm.action

-- These are vars to put things in later (i dont use em all yet)
local config = {}
local keys = {}
local mouse_bindings = {}
local launch_menu = {}

-- This is for newer wezterm versions to use the config builder
if wezterm.config_builder then
	config = wezterm.config_builder()
end

local function is_vim(pane)
	return pane:get_user_vars().IS_NVIM == 'true'
end
local direction_keys = {
	Left = 'h',
	Down = 'j',
	Up = 'k',
	Right = 'l',
	-- reverse lookup
	h = 'Left',
	j = 'Down',
	k = 'Up',
	l = 'Right',
}
local function split_nav(resize_or_move, key)
	return {
		key = key,
		mods = resize_or_move == 'resize' and 'META' or 'CTRL',
		action = wezterm.action_callback(
			function(win, pane)
				if resize_or_move == 'resize' then
					win:perform_action({ AdjustPaneSize = { direction_keys[key], 3 } }, pane)
				else
					win:perform_action({ ActivatePaneDirection = direction_keys[key] }, pane)
				end
			end
		),
	}
end
config.leader = { key = '\\', mods = 'CTRL', timeout_milliseconds = 10000}
config.color_scheme = 'Catppuccin Macchiato'
config.font = wezterm.font('JetBrainsMono Nerd Font')
config.font_size = 9
config.launch_menu = launch_menu
-- makes my cursor blink
config.default_cursor_style = 'BlinkingBar'
config.disable_default_key_bindings = true
config.keys = {
	{ key = 'C', mods = 'CTRL', action = act.CopyTo("ClipboardAndPrimarySelection") },
	{ key = 'V', mods = 'CTRL', action = act.PasteFrom 'Clipboard' },
	{ key = '=', mods = 'CTRL', action = wezterm.action.IncreaseFontSize },
	{ key = '-', mods = 'CTRL', action = wezterm.action.DecreaseFontSize },
	{ key = "s", mods = "LEADER", action = wezterm.action.SplitVertical{ domain = 'CurrentPaneDomain' }},
	{ key = "v", mods = "LEADER", action = wezterm.action.SplitHorizontal{ domain = 'CurrentPaneDomain' }},
	split_nav('move', 'h'),
	split_nav('move', 'j'),
	split_nav('move', 'k'),
	split_nav('move', 'l'),
	split_nav('resize', 'h'),
	split_nav('resize', 'j'),
	split_nav('resize', 'k'),
	split_nav('resize', 'l'),
}
mouse_bindings = {
	{
		event = { Down = { streak = 3, button = 'Left' } },
		action = wezterm.action.SelectTextAtMouseCursor 'SemanticZone',
		mods = 'NONE',
	},
	{
		event = { Down = { streak = 1, button = "Right" } },
		mods = "NONE",
		action = wezterm.action_callback(function(window, pane)
			local has_selection = window:get_selection_text_for_pane(pane) ~= ""
			if has_selection then
				window:perform_action(act.CopyTo("ClipboardAndPrimarySelection"), pane)
				window:perform_action(act.ClearSelection, pane)
			else
				window:perform_action(act({ PasteFrom = "Clipboard" }), pane)
			end
		end),
	},
}
config.mouse_bindings = mouse_bindings

for i = 1, 8 do
	-- CTRL+ALT + number to activate that tab
	table.insert(config.keys, {
	  key = tostring(i),
	  mods = 'CTRL|ALT',
	  action = act.ActivateTab(i - 1),
	})
  end
config.foreground_text_hsb = {
	hue = 1.0,
	saturation = 1.2,
	brightness = 1.5,
}

config.default_domain = 'WSL:Ubuntu-20.04'

return config
