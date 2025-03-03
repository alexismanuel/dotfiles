local on_attach = function(client, bufnr)
	if client.name == 'ruff' then
		-- Disable hover in favor of Pyright
		client.server_capabilities.hoverProvider = false
		-- ruff conf file
		local ruff_config_path = vim.loop.os_homedir() .. '/.config/ruff.toml'
		local project_ruff_config = vim.loop.cwd() .. '/ruff.toml'
		local f = io.open(project_ruff_config, 'r')
		if f ~= nil then
			io.close(f)
			ruff_config_path = project_ruff_config
		end
		require('lspconfig').ruff.setup({
			init_options = {
				settings = {
					format = {
						args = { "--config=" .. ruff_config_path }
					},
					lint = {
						args = { "--config=" .. ruff_config_path }
					}
				}
			}
		})
	end
end
local lspconfig = require('lspconfig')
-- to learn how to use mason.nvim
-- read this: https://github.com/VonHeikemen/lsp-zero.nvim/blob/v3.x/doc/md/guides/integrate-with-mason-nvim.md
require('mason').setup({})
require('mason-lspconfig').setup({
	ensure_installed = {'ruff', 'basedpyright', 'terraformls', 'tflint'},
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
						},
					},
				},
			})
		end,
	},
})

