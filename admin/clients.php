<?php
/**
 * Cyber Kovai - Client Organizations & Partner Engagements (CRUD)
 * Full management for client logos, tracks, case content — matching exact UI design.
 */

require_once __DIR__ . '/includes/auth.php';
ck_admin_require_login();

$action       = $_GET['action'] ?? 'list';
$editId       = $_GET['id'] ?? null;
$currentTrack = $_GET['track'] ?? 'all';

// ─── Handle POST Submissions ────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!ck_csrf_verify()) {
        ck_set_flash('error', 'Security token expired. Please try again.');
        header('Location: clients.php' . ($currentTrack !== 'all' ? "?track={$currentTrack}" : ''));
        exit;
    }

    $postAction = $_POST['action'] ?? 'save';

    // ── Delete Client ──────────────────────────────────────────────────────
    if ($postAction === 'delete') {
        $deleteId = $_POST['id'] ?? '';
        if (!empty($deleteId)) {
            $client  = ck_get_client($deleteId);
            $cName   = $client['name'] ?? 'Client';
            $deleted = ck_delete_client($deleteId);
            if ($deleted) {
                ck_set_flash('success', "Client '{$cName}' was successfully deleted.");
            } else {
                ck_set_flash('error', "Could not delete client '{$cName}'.");
            }
        }
        header('Location: clients.php' . ($currentTrack !== 'all' ? "?track={$currentTrack}" : ''));
        exit;
    }

    // ── Toggle Active / Hidden ─────────────────────────────────────────────
    if ($postAction === 'toggle_status') {
        $toggleId = $_POST['id'] ?? '';
        if (!empty($toggleId)) {
            $newStatus = ck_toggle_client_status($toggleId);
            if ($newStatus !== false) {
                $client = ck_get_client($toggleId);
                $cName  = $client['name'] ?? 'Client';
                if ($newStatus === 'active') {
                    ck_set_flash('success', "Client '{$cName}' is now ACTIVE and visible on the website.");
                } else {
                    ck_set_flash('success', "Client '{$cName}' is now HIDDEN from the website.");
                }
            } else {
                ck_set_flash('error', "Could not toggle client status.");
            }
        }
        header('Location: clients.php' . ($currentTrack !== 'all' ? "?track={$currentTrack}" : ''));
        exit;
    }

    // ── Save (Create or Update) ────────────────────────────────────────────
    if ($postAction === 'save') {
        $id       = !empty($_POST['id']) ? trim($_POST['id']) : null;
        $name     = trim($_POST['name'] ?? '');
        $category = trim($_POST['category'] ?? '');
        $desc     = trim($_POST['desc'] ?? '');
        $track    = $_POST['track'] ?? 'investigation';

        if ($name === '') {
            ck_set_flash('error', 'Client / Organization name cannot be empty.');
            header('Location: clients.php?action=' . ($id ? "edit&id={$id}" : 'add') . "&track={$track}");
            exit;
        }

        // Handle logo upload
        $logoPath = trim($_POST['img'] ?? 'assets/images/client_copconnect.jpg');
        if (!empty($_FILES['logo_file']) && $_FILES['logo_file']['error'] !== UPLOAD_ERR_NO_FILE) {
            $uploadResult = ck_handle_upload($_FILES['logo_file'], 'client');
            if ($uploadResult['success']) {
                $logoPath = $uploadResult['path'];
            } else {
                ck_set_flash('warning', 'Logo upload notice: ' . $uploadResult['error'] . '. Retained existing logo.');
            }
        }

        $clientData = [
            'id'      => $id,
            'name'    => $name,
            'category'=> $category,
            'desc'    => $desc,
            'img'     => $logoPath,
            'alt'     => trim($_POST['alt'] ?? ($name . ' - ' . $category)),
            'website' => trim($_POST['website'] ?? ''),
            'track'   => $track,
            'order'   => isset($_POST['order']) ? (int)$_POST['order'] : 1,
            'status'  => $_POST['status'] ?? 'active',
        ];

        $saved = ck_save_client($clientData, $id);
        if ($saved) {
            $trackLabel = ($track === 'investigation') ? 'Digital Investigation' : (($track === 'cyber') ? 'Cyber Security' : 'Both Tracks');
            ck_set_flash('success', "Client '{$name}' successfully saved for {$trackLabel}!");
            header('Location: clients.php?track=' . ($track === 'both' ? 'all' : $track));
            exit;
        } else {
            ck_set_flash('error', 'Failed to save client to storage.');
        }
    }
}

// ─── Fetch editing item ──────────────────────────────────────────────────────
$editingItem = null;
if ($action === 'edit' && $editId) {
    $editingItem = ck_get_client($editId);
    if (!$editingItem) {
        ck_set_flash('error', "Client organization not found.");
        header('Location: clients.php');
        exit;
    }
}

// ─── Counts & filtered list ──────────────────────────────────────────────────
$allClients         = ck_get_clients('all', true);
$investigationCount = 0;
$cyberCount         = 0;
foreach ($allClients as $c) {
    $t = $c['track'] ?? 'both';
    if ($t === 'investigation' || $t === 'both') $investigationCount++;
    if ($t === 'cyber'         || $t === 'both') $cyberCount++;
}

$displayClients = ($currentTrack === 'all') ? $allClients : ck_get_clients($currentTrack, true);

$adminPageTitle = 'Clients & Partner Organizations';
require_once __DIR__ . '/includes/header.php';
?>

<!-- ═══════════════════════════════════════════════════════════════════════════
     PAGE HEADER ROW
═══════════════════════════════════════════════════════════════════════════ -->
<div class="page-header-row">
    <div>
        <h1 class="page-header-title">Client Organizations &amp; Partners</h1>
        <p class="page-header-desc">Manage trusted client organizations, logos, badges, and case contents displayed separately for Digital Investigation and Cyber Security.</p>
    </div>
    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
        <?php if ($action === 'list'): ?>
            <a href="clients.php?action=add<?= ($currentTrack !== 'all') ? "&track={$currentTrack}" : '' ?>"
               class="btn btn-primary">
                <span>+</span> Add New Client
            </a>
            <a href="../cyber-intelligence.php#ci-clients" target="_blank" rel="noopener"
               class="btn btn-secondary btn-sm"
               title="Preview clients on Digital Investigation page">
                Preview Investigation ➔
            </a>
            <a href="../digital-forensics.php#clients" target="_blank" rel="noopener"
               class="btn btn-secondary btn-sm"
               title="Preview clients on Cyber Security page">
                Preview Cyber ➔
            </a>
        <?php else: ?>
            <a href="clients.php<?= ($currentTrack !== 'all') ? "?track={$currentTrack}" : '' ?>"
               class="btn btn-secondary">
                &larr; Back to Clients List
            </a>
        <?php endif; ?>
    </div>
</div>

<?php if ($action === 'add' || $action === 'edit'): ?>
<!-- ═══════════════════════════════════════════════════════════════════════════
     ADD / EDIT FORM
═══════════════════════════════════════════════════════════════════════════ -->
<div class="admin-card">
    <div class="admin-card-header">
        <h3 class="admin-card-title">
            <?= ($action === 'edit')
                ? '✏️ Edit Client: ' . htmlspecialchars($editingItem['name'])
                : '+ Add New Client Organization' ?>
        </h3>
        <span class="category-tag" style="background: rgba(139,32,255,0.15); color: var(--accent-purple-light); border: 1px solid rgba(139,32,255,0.35);">
            <?= ($action === 'edit')
                ? 'Client ID: ' . htmlspecialchars($editingItem['id'])
                : 'New Client Profile' ?>
        </span>
    </div>
    <div class="admin-card-body">
        <form method="POST" action="clients.php" enctype="multipart/form-data">
            <?= ck_csrf_field() ?>
            <input type="hidden" name="action" value="save">
            <?php if ($action === 'edit'): ?>
                <input type="hidden" name="id" value="<?= htmlspecialchars($editingItem['id']) ?>">
            <?php endif; ?>

            <div class="form-grid">

                <!-- Client Name -->
                <div class="form-group">
                    <label for="client_name" class="form-label">
                        Client / Organization Name <span class="required">*</span>
                    </label>
                    <input type="text"
                           id="client_name"
                           name="name"
                           class="form-control"
                           required
                           placeholder="e.g. CopConnect or Gokarna Samudra"
                           value="<?= htmlspecialchars($editingItem['name'] ?? '') ?>">
                    <span class="form-help">Company, institutional partner, or corporate client title.</span>
                </div>

                <!-- Category -->
                <div class="form-group">
                    <label for="category" class="form-label">
                        Category / Industry Tag <span class="required">*</span>
                    </label>
                    <input type="text"
                           id="category"
                           name="category"
                           class="form-control"
                           required
                           placeholder="e.g. Information Sharing and Analysis Center"
                           value="<?= htmlspecialchars($editingItem['category'] ?? '') ?>">
                    <span class="form-help">Highlighted label shown under client name (e.g. Beach Resort &amp; Hospitality).</span>
                </div>

                <!-- Track -->
                <div class="form-group">
                    <label for="track" class="form-label">
                        Department / Display Track <span class="required">*</span>
                    </label>
                    <?php
                    $selectedTrack = $editingItem['track'] ?? ($currentTrack !== 'all' ? $currentTrack : 'investigation');
                    ?>
                    <select id="track" name="track" class="form-control" style="font-weight: 600;" required>
                        <option value="investigation" <?= ($selectedTrack === 'investigation') ? 'selected' : '' ?>>
                            🔍 Digital Investigation &amp; Forensics
                        </option>
                        <option value="cyber" <?= ($selectedTrack === 'cyber') ? 'selected' : '' ?>>
                            🛡️ Cyber Security &amp; Defense
                        </option>
                        <option value="both" <?= ($selectedTrack === 'both') ? 'selected' : '' ?>>
                            🌐 Both Tracks (Investigation &amp; Cyber)
                        </option>
                    </select>
                    <span class="form-help">Choose which page(s) on the website will showcase this client.</span>
                </div>

                <!-- Order -->
                <div class="form-group">
                    <label for="order" class="form-label">Display Order Sequence</label>
                    <input type="number"
                           id="order"
                           name="order"
                           class="form-control"
                           min="1"
                           value="<?= htmlspecialchars($editingItem['order'] ?? (count($allClients) + 1)) ?>">
                    <span class="form-help">Position in the clients row (1 = first displayed).</span>
                </div>

                <!-- Status -->
                <div class="form-group">
                    <label for="status" class="form-label">Publication Status</label>
                    <select id="status" name="status" class="form-control" style="font-weight: 600;">
                        <option value="active"   <?= (($editingItem['status'] ?? 'active') === 'active')   ? 'selected' : '' ?>>✅ Active (Visible on Website)</option>
                        <option value="inactive" <?= (($editingItem['status'] ?? 'active') === 'inactive') ? 'selected' : '' ?>>🔒 Hidden (Hide from Website)</option>
                    </select>
                    <span class="form-help">Instantly show or hide this client from the public website.</span>
                </div>

                <!-- Website URL -->
                <div class="form-group">
                    <label for="website" class="form-label">Client Website URL <span style="color: var(--text-muted); font-weight: 400;">(Optional)</span></label>
                    <input type="url"
                           id="website"
                           name="website"
                           class="form-control"
                           placeholder="https://example.com"
                           value="<?= htmlspecialchars($editingItem['website'] ?? '') ?>">
                    <span class="form-help">Shown as a "Visit Website ↗" link in the admin table if provided.</span>
                </div>

                <!-- Logo Upload -->
                <div class="form-group col-full">
                    <label for="logo_file" class="form-label">
                        Client Company Logo <span class="required">*</span>
                    </label>
                    <div class="input-with-preview" style="align-items: flex-start; gap: 1.25rem;">
                        <?php
                        $currentLogo = $editingItem['img'] ?? 'assets/images/client_copconnect.jpg';
                        ?>
                        <!-- Logo Preview Box -->
                        <div style="
                            background: #ffffff;
                            padding: 10px;
                            border-radius: 12px;
                            border: 1px solid var(--border-color);
                            width: 180px;
                            height: 100px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-shrink: 0;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                        ">
                            <img src="../<?= htmlspecialchars($currentLogo) ?>"
                                 alt="Logo Preview"
                                 id="logoPreview"
                                 style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        </div>
                        <div style="flex: 1;">
                            <input type="file"
                                   id="logo_file"
                                   name="logo_file"
                                   class="form-control"
                                   accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                   data-preview="#logoPreview"
                                   style="margin-bottom: 0.65rem;">
                            <input type="text"
                                   id="img"
                                   name="img"
                                   class="form-control"
                                   placeholder="assets/images/client_logo.jpg"
                                   value="<?= htmlspecialchars($currentLogo) ?>">
                            <span class="form-help">Upload transparent PNG, SVG, WebP, or JPG. Logos are displayed in a white high-contrast container on the website.</span>
                        </div>
                    </div>
                </div>

                <!-- Alt Text -->
                <div class="form-group col-full">
                    <label for="alt" class="form-label">Logo Alt Text <span style="color: var(--text-muted); font-weight: 400;">(Accessibility &amp; SEO)</span></label>
                    <input type="text"
                           id="alt"
                           name="alt"
                           class="form-control"
                           placeholder="e.g. CopConnect - Information Sharing and Analysis Center"
                           value="<?= htmlspecialchars($editingItem['alt'] ?? '') ?>">
                    <span class="form-help">Descriptive alt text for screen readers and SEO. Defaults to client name + category if left blank.</span>
                </div>

                <!-- Case Description -->
                <div class="form-group col-full">
                    <label for="desc" class="form-label">
                        Case Engagement Content / Description <span class="required">*</span>
                    </label>
                    <textarea id="desc"
                              name="desc"
                              rows="4"
                              class="form-control"
                              required
                              placeholder="Describe the scope of work, strategic partnership, digital forensic investigation, or cybersecurity protection provided..."><?= htmlspecialchars($editingItem['desc'] ?? '') ?></textarea>
                    <span class="form-help">This description appears in the client card on the public website (2–3 sentences recommended).</span>
                </div>

            </div><!-- /.form-grid -->

            <!-- Form Actions -->
            <div style="padding-top: 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem;">
                <a href="clients.php<?= ($currentTrack !== 'all') ? "?track={$currentTrack}" : '' ?>"
                   class="btn btn-secondary">
                    Cancel
                </a>
                <button type="submit" class="btn btn-primary">
                    <span>💾</span> <?= ($action === 'edit') ? 'Update Client' : 'Save Client Profile' ?>
                </button>
            </div>
        </form>
    </div>
</div>

<?php else: ?>
<!-- ═══════════════════════════════════════════════════════════════════════════
     LIST VIEW
═══════════════════════════════════════════════════════════════════════════ -->

<!-- Track Filter Tabs -->
<div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">

    <a href="clients.php?track=all"
       class="btn btn-sm <?= ($currentTrack === 'all') ? 'btn-primary' : 'btn-secondary' ?>"
       style="<?= ($currentTrack === 'all') ? 'background: #9e3eff; border-color: #9e3eff;' : '' ?>">
        All Clients (<?= count($allClients) ?>)
    </a>

    <a href="clients.php?track=investigation"
       class="btn btn-sm <?= ($currentTrack === 'investigation') ? 'btn-primary' : 'btn-secondary' ?>"
       style="<?= ($currentTrack === 'investigation') ? 'background: #8b20ff; border-color: #8b20ff;' : '' ?>">
        🔍 Digital Investigation (<?= $investigationCount ?>)
    </a>

    <a href="clients.php?track=cyber"
       class="btn btn-sm <?= ($currentTrack === 'cyber') ? 'btn-primary' : 'btn-secondary' ?>"
       style="<?= ($currentTrack === 'cyber') ? 'background: #00b4d8; border-color: #00b4d8;' : '' ?>">
        🛡️ Cyber Security (<?= $cyberCount ?>)
    </a>

</div>

<!-- Clients Table Card -->
<div class="admin-card">
    <div class="admin-card-header">
        <h3 class="admin-card-title">
            <?php if ($currentTrack === 'investigation'): ?>
                🔍 Digital Investigation Clients (<?= count($displayClients) ?>)
            <?php elseif ($currentTrack === 'cyber'): ?>
                🛡️ Cyber Security Clients (<?= count($displayClients) ?>)
            <?php else: ?>
                All Trusted Clients &amp; Partners (<?= count($displayClients) ?>)
            <?php endif; ?>
        </h3>
        <div>
            <a href="clients.php?action=add<?= ($currentTrack !== 'all') ? "&track={$currentTrack}" : '' ?>"
               class="btn btn-primary btn-sm">
                + Add Client
            </a>
        </div>
    </div>

    <div class="table-responsive">
        <table class="admin-table">
            <thead>
                <tr>
                    <th style="width: 90px;">Logo</th>
                    <th>Client / Organization</th>
                    <th style="width: 160px;">Department / Track</th>
                    <th>Case Engagement Description</th>
                    <th style="width: 65px; text-align: center;">Order</th>
                    <th style="width: 110px;">Status</th>
                    <th style="text-align: right; width: 180px;">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($displayClients)): ?>
                    <?php foreach ($displayClients as $c): ?>
                    <?php
                        $cId     = htmlspecialchars($c['id']);
                        $cName   = htmlspecialchars($c['name']);
                        $cStatus = $c['status'] ?? 'active';
                        $cTrack  = $c['track'] ?? 'both';
                        $cImg    = htmlspecialchars($c['img'] ?? 'assets/images/client_copconnect.jpg');
                        $cAlt    = htmlspecialchars($c['alt'] ?? $c['name']);
                        $isActive = ($cStatus === 'active');
                        $trackParam = ($currentTrack !== 'all') ? "?track={$currentTrack}" : '';
                    ?>
                    <tr>

                        <!-- LOGO -->
                        <td>
                            <div style="
                                background: #ffffff;
                                padding: 5px 7px;
                                border-radius: 8px;
                                border: 1px solid rgba(255,255,255,0.15);
                                width: 76px;
                                height: 44px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            ">
                                <img src="../<?= $cImg ?>"
                                     alt="<?= $cAlt ?>"
                                     style="max-width: 100%; max-height: 100%; object-fit: contain;">
                            </div>
                        </td>

                        <!-- CLIENT / ORGANIZATION -->
                        <td>
                            <span class="cell-title"><?= $cName ?></span>
                            <span class="cell-subtitle"><?= htmlspecialchars($c['category'] ?? '') ?></span>
                            <?php if (!empty($c['website'])): ?>
                                <a href="<?= htmlspecialchars($c['website']) ?>"
                                   target="_blank"
                                   rel="noopener"
                                   style="
                                       font-size: 0.72rem;
                                       color: var(--accent-purple-light);
                                       text-decoration: none;
                                       display: inline-flex;
                                       align-items: center;
                                       gap: 3px;
                                       margin-top: 3px;
                                   ">
                                    🔗 Visit Website ↗
                                </a>
                            <?php endif; ?>
                        </td>

                        <!-- DEPARTMENT / TRACK -->
                        <td>
                            <?php if ($cTrack === 'investigation'): ?>
                                <span class="category-tag" style="
                                    background: rgba(139,32,255,0.18);
                                    color: #c44bff;
                                    border: 1px solid rgba(139,32,255,0.35);
                                    white-space: nowrap;">
                                    🔍 Investigation
                                </span>
                            <?php elseif ($cTrack === 'cyber'): ?>
                                <span class="category-tag" style="
                                    background: rgba(0,180,216,0.18);
                                    color: #00e5ff;
                                    border: 1px solid rgba(0,180,216,0.35);
                                    white-space: nowrap;">
                                    🛡️ Cyber Security
                                </span>
                            <?php else: ?>
                                <span class="category-tag" style="
                                    background: rgba(0,230,118,0.18);
                                    color: #00e676;
                                    border: 1px solid rgba(0,230,118,0.35);
                                    white-space: nowrap;">
                                    🌐 Both Tracks
                                </span>
                            <?php endif; ?>
                        </td>

                        <!-- CASE ENGAGEMENT DESCRIPTION -->
                        <td style="max-width: 300px;">
                            <p style="
                                font-size: 0.82rem;
                                color: var(--text-secondary);
                                line-height: 1.5;
                                display: -webkit-box;
                                -webkit-line-clamp: 2;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                                margin: 0;
                            ">
                                <?= htmlspecialchars($c['desc'] ?? '') ?>
                            </p>
                        </td>

                        <!-- ORDER -->
                        <td style="text-align: center;">
                            <span style="
                                font-weight: 700;
                                color: var(--text-muted);
                                font-size: 0.85rem;
                            ">#<?= (int)($c['order'] ?? 1) ?></span>
                        </td>

                        <!-- STATUS (clickable toggle pill) -->
                        <td>
                            <form method="POST" action="clients.php<?= $trackParam ?>" style="display:inline; margin:0;">
                                <?= ck_csrf_field() ?>
                                <input type="hidden" name="action" value="toggle_status">
                                <input type="hidden" name="id"     value="<?= $cId ?>">
                                <?php if ($isActive): ?>
                                    <button type="submit"
                                            class="status-pill active"
                                            style="cursor: pointer; background: none; border: 1px solid rgba(0,230,118,0.35);"
                                            title="Click to hide this client from the website">
                                        ● ACTIVE
                                    </button>
                                <?php else: ?>
                                    <button type="submit"
                                            class="status-pill"
                                            style="cursor: pointer; background: rgba(255,171,0,0.15); color: #ffab00; border: 1px solid rgba(255,171,0,0.35);"
                                            title="Click to show this client on the website">
                                        ○ HIDDEN
                                    </button>
                                <?php endif; ?>
                            </form>
                        </td>

                        <!-- ACTIONS: Hide/Show · Edit · Delete -->
                        <td>
                            <div class="action-btns-group" style="justify-content: flex-end;">

                                <!-- Hide / Show toggle button -->
                                <form method="POST" action="clients.php<?= $trackParam ?>" style="display:inline; margin:0;">
                                    <?= ck_csrf_field() ?>
                                    <input type="hidden" name="action" value="toggle_status">
                                    <input type="hidden" name="id"     value="<?= $cId ?>">
                                    <?php if ($isActive): ?>
                                        <button type="submit" class="btn-action hide" title="Hide this client from website">
                                            Hide
                                        </button>
                                    <?php else: ?>
                                        <button type="submit" class="btn-action show" title="Make this client visible on website">
                                            Show
                                        </button>
                                    <?php endif; ?>
                                </form>

                                <!-- Edit -->
                                <a href="clients.php?action=edit&id=<?= urlencode($c['id']) ?>&track=<?= urlencode($currentTrack) ?>"
                                   class="btn-action edit">
                                    Edit
                                </a>

                                <!-- Delete (uses shared modal in footer.php) -->
                                <button type="button"
                                        class="btn-action delete"
                                        onclick="
                                            confirmDelete(
                                                'clients.php<?= addslashes($trackParam) ?>',
                                                '<?= htmlspecialchars(addslashes($c['name'])) ?>',
                                                '<?= ck_csrf_token() ?>'
                                            );
                                            (function() {
                                                var f = document.getElementById('deleteConfirmForm');
                                                var old = f.querySelector('input[name=id]');
                                                if (old) old.remove();
                                                var inp = document.createElement('input');
                                                inp.type  = 'hidden';
                                                inp.name  = 'id';
                                                inp.value = '<?= addslashes($c['id']) ?>';
                                                f.appendChild(inp);
                                            })();
                                        ">
                                    Delete
                                </button>

                            </div>
                        </td>

                    </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🏢</div>
                            <p style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-secondary);">No clients found<?= ($currentTrack !== 'all') ? ' for this track' : '' ?>.</p>
                            <a href="clients.php?action=add<?= ($currentTrack !== 'all') ? "&track={$currentTrack}" : '' ?>"
                               class="btn btn-primary btn-sm" style="margin-top: 0.5rem;">
                                + Add First Client
                            </a>
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div><!-- /.table-responsive -->
</div><!-- /.admin-card -->

<?php endif; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
