local telescope_builtin = require('telescope.builtin')
local telescope = require('telescope')
local custom = {}
telescope.setup {
	defaults = {
		prompt_position = 'top',
		layout_strategy = 'horizontal',
		sorting_strategy = 'ascending',
	}
}
custom.find_files = function()
	telescope_builtin.find_files {
		find_command = { 'rg', '--files', '--iglob', '!.git', '--iglob', '!.venv', '--hidden' },
		previewer = false
	}
end
vim.keymap.set('n', '<leader>ff', custom.find_files, {})
vim.keymap.set("n", "<leader>fg", ":lua require('telescope').extensions.live_grep_args.live_grep_args()<CR>")

