vim.opt.number = true
vim.opt.numberwidth = 3
vim.opt.softtabstop = 4
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.mouse = ''

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
		dependencies = {'nvim-lua/plenary.nvim'}
	},
	{
		'williamboman/mason.nvim',
		'williamboman/mason-lspconfig.nvim',
		'VonHeikemen/lsp-zero.nvim', branch = 'v3.x',
		'neovim/nvim-lspconfig',
		'hrsh7th/cmp-nvim-lsp',
		'hrsh7th/nvim-cmp',
		'L3MON4D3/LuaSnip',
	},
	{
		'akinsho/toggleterm.nvim', version = "*", config = true
	}
}

-- Setup
require("lazy").setup({
  spec = plugins,
  -- Configure any other settings here. See the documentation for more details.
  -- colorscheme that will be used when installing plugins.
  install = { colorscheme = { "catppuccin-macchiato" } },
  -- automatically check for plugin updates
  checker = { enabled = true },
})
require("lualine").setup {
    options = {
	    theme = "auto",
	}
}
require('autoclose').setup()
require('barbar').setup{
	version = '^1.0.0'
}

vim.cmd.colorscheme "catppuccin-macchiato"

local map = vim.api.nvim_set_keymap
local opts = { noremap = true, silent = true }

-- Move to previous/next
map('n', '<A-,>', '<Cmd>BufferPrevious<CR>', opts)
map('n', '<A-.>', '<Cmd>BufferNext<CR>', opts)
-- Re-order to previous/next
map('n', '<A-<>', '<Cmd>BufferMovePrevious<CR>', opts)
map('n', '<A->>', '<Cmd>BufferMoveNext<CR>', opts)
-- Goto buffer in position...
map('n', '<A-1>', '<Cmd>BufferGoto 1<CR>', opts)
map('n', '<A-2>', '<Cmd>BufferGoto 2<CR>', opts)
map('n', '<A-3>', '<Cmd>BufferGoto 3<CR>', opts)
map('n', '<A-4>', '<Cmd>BufferGoto 4<CR>', opts)
map('n', '<A-5>', '<Cmd>BufferGoto 5<CR>', opts)
map('n', '<A-6>', '<Cmd>BufferGoto 6<CR>', opts)
map('n', '<A-7>', '<Cmd>BufferGoto 7<CR>', opts)
map('n', '<A-8>', '<Cmd>BufferGoto 8<CR>', opts)
map('n', '<A-9>', '<Cmd>BufferGoto 9<CR>', opts)
map('n', '<A-0>', '<Cmd>BufferLast<CR>', opts)
-- Pin/unpin buffer
map('n', '<A-p>', '<Cmd>BufferPin<CR>', opts)
-- Close buffer
map('n', '<A-c>', '<Cmd>BufferClose<CR>', opts)

vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1

-- optionally enable 24-bit colour
vim.opt.termguicolors = true

-- empty setup using defaults
require("nvim-tree").setup()

vim.keymap.set('n', '<leader>tf', ':NvimTreeFindFileToggle<CR>')
vim.keymap.set('n', '<leader>F', ':NvimTreeFocus<CR>')

local builtin = require('telescope.builtin')
vim.keymap.set('n', '<leader>ff', builtin.find_files, {})
vim.keymap.set('n', '<leader>fg', builtin.live_grep, {})
vim.keymap.set('n', '<leader>fb', builtin.buffers, {})
vim.keymap.set('n', '<leader>fh', builtin.help_tags, {})

require 'nvim-treesitter.configs'.setup {
	ensure_installed = { "c", "lua", "vim", "vimdoc", "query", "elixir", "heex", "javascript", "html" },
    	sync_install = false,
    	highlight = { enable = true },
	indent = { enable = true }, 
}


local cmp = require('cmp')
cmp.setup({
	snippet = {
		expand = function(args)
			vim.fn["vsnip#anonymous"](args.body)
	    end,
	},
	window = {
		completion = cmp.config.window.bordered(),
		documentation = cmp.config.window.bordered(),
    },
	mapping = cmp.mapping.preset.insert({
      ['<Tab>'] = cmp.mapping.confirm({ select = true }), -- Accept currently selected item. Set `select` to `false` to only confirm explicitly selected items.
    }),
	sources = cmp.config.sources({
      { name = 'nvim_lsp' },
      { name = 'luasnip' }, -- For luasnip users.
    }, {
      { name = 'buffer' },
    })
})


local lsp_zero = require('lsp-zero')

lsp_zero.on_attach(function(client, bufnr)
  -- see :help lsp-zero-keybindings
  -- to learn the available actions
  lsp_zero.default_keymaps({buffer = bufnr})
end)


local on_attach = function(client, bufnr)
  if client.name == 'ruff' then
    -- Disable hover in favor of Pyright
    client.server_capabilities.hoverProvider = false
  end
end
local lspconfig = require('lspconfig')
-- to learn how to use mason.nvim
-- read this: https://github.com/VonHeikemen/lsp-zero.nvim/blob/v3.x/doc/md/guides/integrate-with-mason-nvim.md
require('mason').setup({})
require('mason-lspconfig').setup({
  ensure_installed = {'ruff', 'basedpyright'},
  handlers = {
    function(server_name)
      lspconfig[server_name].setup({})
    end,
	ruff = function()
        lspconfig.ruff.setup {
			on_attach = on_attach
		}
    end,
    basedpyright = function()
		lspconfig.basedpyright.setup({
			settings = {
				basedpyright = {
					disableOrganizeImports = true,
					disableTaggedHints = false,
					analysis = {
						typeCheckingMode = "standard",
						useLibraryCodeForTypes = true, -- Analyze library code for type information
						autoImportCompletions = true,
						autoSearchPaths = true,
						diagnosticSeverityOverrides = {
							reportIgnoreCommentWithoutRule = true,
						},
					},
				},
			},
        })
    end,
  },
})

vim.keymap.set('n', '<C-t>', ':ToggleTerm<CR>')
require('toggleterm').setup{
	shade_terminal = false,
	direction = 'horizontal',
	border = 'curved',
	persist_mode = true,
	shell = bash,
}

function _G.set_terminal_keymaps()
  local opts = {buffer = 0}
  vim.keymap.set('t', '<esc>', [[<C-\><C-n>]], opts)
  vim.keymap.set('t', 'jk', [[<C-\><C-n>]], opts)
  vim.keymap.set('t', '<C-h>', [[<Cmd>wincmd h<CR>]], opts)
  vim.keymap.set('t', '<C-j>', [[<Cmd>wincmd j<CR>]], opts)
  vim.keymap.set('t', '<C-k>', [[<Cmd>wincmd k<CR>]], opts)
  vim.keymap.set('t', '<C-l>', [[<Cmd>wincmd l<CR>]], opts)
  vim.keymap.set('t', '<C-w>', [[<C-\><C-n><C-w>]], opts)
end

