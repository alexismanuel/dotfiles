require('mason').setup({})
require('mason-lspconfig').setup({
	ensure_installed = {'ruff', 'basedpyright', 'terraformls', 'tflint'},
})

vim.api.nvim_create_autocmd("LspAttach", {
  group = vim.api.nvim_create_augroup('lsp_attach_disable_ruff_hover', { clear = true }),
  callback = function(args)
    local client = vim.lsp.get_client_by_id(args.data.client_id)
    if client == nil then
      return
    end
    if client.name == 'ruff' then
      -- Disable hover in favor of Pyright
      client.server_capabilities.hoverProvider = false
    end
  end,
  desc = 'LSP: Disable hover capability from Ruff',
})

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


-- Ruff
local ruff_config_path = vim.loop.os_homedir() .. '/.config/ruff.toml'
local project_ruff_config = vim.loop.cwd() .. '/ruff.toml'
local f = io.open(project_ruff_config, 'r')
if f ~= nil then
	io.close(f)
	ruff_config_path = project_ruff_config
end
vim.lsp.config('ruff', {
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
vim.lsp.enable('ruff')

-- BasedPyright
vim.lsp.config('basedpyright', {
  init_options = {
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
    }
  }
})
vim.lsp.enable('basedpyright')
