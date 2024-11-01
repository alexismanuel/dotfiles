local lsp_zero = require('lsp-zero')
local lsp_attach = function(client, bufnr)
	-- see :help lsp-zero-keybindings
	-- to learn the available actions
	lsp_zero.default_keymaps({buffer = bufnr})

	local opts = { noremap = true, silent = true, buffer = bufnr }
	vim.keymap.set('n', 'gr', '<cmd>lua vim.lsp.buf.rename()<cr>', opts)
	vim.keymap.set('n', 'gl', '<cmd>lua vim.diagnostic.open_float()<cr>', opts)
	vim.keymap.set("n", "gD", vim.lsp.buf.declaration, bufopts)
	vim.keymap.set("n", "gd", vim.lsp.buf.definition, bufopts)
	vim.keymap.set("n", "gi", vim.lsp.buf.implementation, bufopts)

end

lsp_zero.extend_lspconfig({
	sign_text = {
		error = '✘',
		warn = '▲',
		hint = '⚑',
		info = '»',
	},
	lsp_attach = lsp_attach
})
