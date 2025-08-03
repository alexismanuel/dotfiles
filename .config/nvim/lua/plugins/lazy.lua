-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
	local lazyrepo = "https://github.com/folke/lazy.nvim.git"
	local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
	if vim.v.shell_error ~= 0 then
		vim.api.nvim_echo({
			{ "Failed to clone lazy.nvim:\n", "ErrorMsg" },
			{ out, "WarningMsg" },
			{ "\nPress any key to exit..." },
		}, true, {})
		vim.fn.getchar()
		os.exit(1)
	end
end

vim.opt.rtp:prepend(lazypath)

local plugins = {
	{ "catppuccin/nvim", name = "catppuccin", priority = 1000 },
	{
		'nvim-lualine/lualine.nvim',
		dependencies = {'nvim-tree/nvim-web-devicons'},
	},
	{'m4xshen/autoclose.nvim'},
	{'romgrk/barbar.nvim'},
	{
		"nvim-tree/nvim-tree.lua",
		version = "*",
		lazy = false,
		dependencies = {
			"nvim-tree/nvim-web-devicons",
		},
		config = function()
			require("nvim-tree").setup {}
		end,
	},
	{
		"nvim-treesitter/nvim-treesitter",
		build = ":TSUpdate"
	},
	{
		'nvim-telescope/telescope.nvim', tag = '0.1.8',
		dependencies = {
			{'nvim-lua/plenary.nvim'},
			{
				"nvim-telescope/telescope-live-grep-args.nvim",
				version = "^1.0.0",
			},
		}
	},
	{'williamboman/mason.nvim', version = '^1.0.0'},
	{'williamboman/mason-lspconfig.nvim', version = '^1.0.0'},
	{	'VonHeikemen/lsp-zero.nvim',
		'neovim/nvim-lspconfig',
		'hrsh7th/cmp-nvim-lsp',
		'hrsh7th/nvim-cmp',
		'L3MON4D3/LuaSnip',
	},
	{
		'akinsho/toggleterm.nvim', version = "*", config = true
	},
	{
		"folke/which-key.nvim",
		event = "VeryLazy",
		opts = {
			-- your configuration comes here
			-- or leave it empty to use the default settings
			-- refer to the configuration section below
		},
		keys = {
			{
				"<leader>?",
				function()
					require("which-key").show({ global = false })
				end,
				desc = "Buffer Local Keymaps (which-key)",
			},
		},
	},
	{"Vimjas/vim-python-pep8-indent"},
	{'kevinhwang91/nvim-ufo', dependencies = {'kevinhwang91/promise-async'}},
	{"cappyzawa/trim.nvim"},
	{
		"iamcco/markdown-preview.nvim",
		cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
		ft = { "markdown" },
		build = function() vim.fn["mkdp#util#install"]() end,
		-- build = function(plugin)
		-- 	if vim.fn.executable "npx" then
		-- 		vim.cmd("!cd " .. plugin.dir .. " && cd app && npx --yes yarn install")
		-- 	else
		-- 		vim.cmd [[Lazy load markdown-preview.nvim]]
		-- 		vim.fn["mkdp#util#install"]()
		-- 	end
		-- end,
		-- init = function()
		-- 	if vim.fn.executable "npx" then vim.g.mkdp_filetypes = { "markdown" } end
		-- end,
	},
	{"mrjones2014/smart-splits.nvim"},
	{
		"ntpeters/vim-better-whitespace",
		event = "BufRead",
	},
	{
		'NvChad/nvim-colorizer.lua',
		event = "BufEnter",
		config = true
	},
	{
		"folke/snacks.nvim",
		priority = 1000,
		lazy = false,
		---@type snacks.Config
		opts = {
			-- your configuration comes here
			-- or leave it empty to use the default settings
			-- refer to the configuration section below
			bigfile = { enabled = true },
			dashboard = { enabled = true },
			explorer = { enabled = false },
			indent = { enabled = true },
			input = { enabled = true },
			picker = { enabled = true },
			notifier = { enabled = true },
			quickfile = { enabled = true },
			scope = { enabled = true },
			scroll = { enabled = true },
			statuscolumn = { enabled = true },
			words = { enabled = true },
		},
	},
	{
		-- support for image pasting
		"HakonHarnes/img-clip.nvim",
		event = "VeryLazy",
		opts = {
			-- recommended settings
			default = {
				embed_image_as_base64 = false,
				prompt_for_file_name = false,
				drag_and_drop = {
					insert_mode = true,
				},
				-- required for Windows users
				use_absolute_path = true,
			},
		},
	},
	{
		-- Make sure to set this up properly if you have lazy=true
		'MeanderingProgrammer/render-markdown.nvim',
		opts = {
			file_types = { "markdown", "Avante" },
		},
		ft = { "markdown", "Avante" },
	},
	{'sindrets/diffview.nvim'},
	{'akinsho/git-conflict.nvim', version = "*", config = true},
}

require("lazy").setup({
	spec = plugins,
	install = { colorscheme = { "catppuccin-macchiato" } },
	checker = { enabled = true },
})
