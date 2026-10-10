package com.garciloga.android

import android.app.Activity
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.content.res.Configuration
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Message
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.SslErrorHandler
import android.net.http.SslError
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.URLUtil
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import java.util.Locale

/**
 * Garciloga Android: cliente oficial de la plataforma web.
 *
 * - Usa el backend REAL (cookies HttpOnly, roles, RLS, Stripe y cursos) de Garciloga.
 * - No almacena credenciales, tokens ni secretos dentro del APK.
 * - Nunca inyecta un puente JavaScript hacia código Android.
 * - Los dominios ajenos se abren en el navegador externo.
 * - No ofrece progreso sin conexión, notificaciones push o funciones no publicadas.
 */
class MainActivity : Activity() {

    private val homeUrl: String = BuildConfig.APP_URL.trimEnd('/') + "/"
    private val homeUri: Uri = Uri.parse(homeUrl)

    private lateinit var root: FrameLayout
    private lateinit var browser: WebView
    private lateinit var progress: ProgressBar
    private lateinit var errorPanel: LinearLayout
    private var isMainFrameUnavailable = false
    private var fileResult: ValueCallback<Array<Uri>>? = null
    private var systemBack: OnBackInvokedCallback? = null

    companion object {
        private const val FILE_PICKER_REQUEST = 4102
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        if (Build.VERSION.SDK_INT < 35) {
            @Suppress("DEPRECATION")
            window.statusBarColor = Color.rgb(14, 42, 34)
            @Suppress("DEPRECATION")
            window.navigationBarColor = Color.rgb(14, 42, 34)
        }

        root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(241, 246, 243)) }
        browser = createBrowser()
        root.addView(browser, FrameLayout.LayoutParams(-1, -1))

        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progressTintList = ColorStateList.valueOf(Color.rgb(9, 99, 77))
            progressBackgroundTintList = ColorStateList.valueOf(Color.TRANSPARENT)
            visibility = View.GONE
            contentDescription = getString(R.string.app_name)
        }
        root.addView(progress, FrameLayout.LayoutParams(-1, dp(3), Gravity.TOP))

        errorPanel = buildOfflinePanel()
        root.addView(errorPanel, FrameLayout.LayoutParams(-1, -1))
        setContentView(root)

        // Android 15 y superior fuerza interfaz edge-to-edge: aplicar insets una sola vez.
        if (Build.VERSION.SDK_INT >= 35) {
            window.setDecorFitsSystemWindows(false)
            // En Android 15+ las barras son transparentes sobre el fondo crema.
            // Iconos oscuros para conservar contraste accesible.
            val barFlags = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            window.insetsController?.setSystemBarsAppearance(barFlags, barFlags)
            root.setOnApplyWindowInsetsListener { view, insets ->
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
                insets
            }
            root.requestApplyInsets()
        }

        if (Build.VERSION.SDK_INT >= 33) {
            val callback = OnBackInvokedCallback { navigateBack() }
            systemBack = callback
            onBackInvokedDispatcher.registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT, callback
            )
        }

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        val restored = savedInstanceState?.let { browser.restoreState(it) }
        if (restored == null) browser.loadUrl(homeUrl)
    }

    private fun createBrowser(): WebView = WebView(this).apply {
        setBackgroundColor(Color.rgb(241, 246, 243))
        isVerticalScrollBarEnabled = false
        isHorizontalScrollBarEnabled = false
        isFocusableInTouchMode = true

        settings.apply {
            javaScriptEnabled = true  // Requisito de Next.js/React; solo navegación de origen propio.
            domStorageEnabled = true  // Preferencias y funcionamiento de frontend.
            databaseEnabled = false
            allowFileAccess = false
            allowContentAccess = true  // Selección con Storage Access Framework.
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_NO_CACHE
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = false
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            mediaPlaybackRequiresUserGesture = true
            if (Build.VERSION.SDK_INT >= 26) safeBrowsingEnabled = true
        }

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(this, false)

        webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView, request: WebResourceRequest
            ): Boolean {
                if (!request.isForMainFrame) return false
                return routeNavigation(request.url)
            }

            override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
                isMainFrameUnavailable = false
                errorPanel.visibility = View.GONE
                progress.visibility = View.VISIBLE
                progress.progress = 5
            }

            override fun onPageFinished(view: WebView, url: String) {
                progress.visibility = View.GONE
                if (!isMainFrameUnavailable) errorPanel.visibility = View.GONE
                CookieManager.getInstance().flush()
            }

            override fun onReceivedError(
                view: WebView, request: WebResourceRequest, error: WebResourceError
            ) {
                if (request.isForMainFrame) showConnectionProblem()
            }

            override fun onReceivedSslError(
                view: WebView, handler: SslErrorHandler, error: SslError
            ) {
                handler.cancel() // Nunca saltar certificados vencidos, inválidos o interceptados.
                showConnectionProblem()
            }
        }

        webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, value: Int) {
                progress.progress = value
                progress.visibility = if (value < 100 && !isMainFrameUnavailable) View.VISIBLE else View.GONE
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                // Cámara/micrófono no están integrados en esta primera versión.
                request.deny()
            }

            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                fileResult?.onReceiveValue(null)
                fileResult = callback
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    val types = params.acceptTypes
                        .flatMap { it.split(',') }
                        .map { it.trim() }
                        .filter { it.contains('/') && !it.contains(';') }
                        .distinct()
                    if (types.isNotEmpty()) {
                        putExtra(Intent.EXTRA_MIME_TYPES, types.toTypedArray())
                    }
                    putExtra(
                        Intent.EXTRA_ALLOW_MULTIPLE,
                        params.mode == FileChooserParams.MODE_OPEN_MULTIPLE
                    )
                }
                return try {
                    @Suppress("DEPRECATION")
                    startActivityForResult(intent, FILE_PICKER_REQUEST)
                    true
                } catch (_: ActivityNotFoundException) {
                    fileResult?.onReceiveValue(null)
                    fileResult = null
                    toast(R.string.file_not_supported)
                    true
                }
            }

            override fun onCreateWindow(
                view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message
            ): Boolean {
                if (!isUserGesture) return false
                // Los target=_blank nunca abren una segunda sesión web sin supervisión.
                val popup = WebView(this@MainActivity)
                popup.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView, request: WebResourceRequest
                    ): Boolean {
                        if (request.isForMainFrame) {
                            val uri = request.url
                            if (isTrustedOrigin(uri)) browser.loadUrl(uri.toString())
                            else routeNavigation(uri)
                            view.post { view.destroy() }
                        }
                        return true
                    }
                }
                val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
                transport.webView = popup
                resultMsg.sendToTarget()
                return true
            }
        }

        setDownloadListener(DownloadListener { url, userAgent, disposition, mimeType, _ ->
            downloadFile(url, userAgent, disposition, mimeType)
        })
    }

    /** Solo el origen HTTPS exacto puede navegar dentro de esta WebView. */
    private fun isTrustedOrigin(uri: Uri): Boolean =
        uri.scheme.equals("https", ignoreCase = true) &&
        uri.host.equals(homeUri.host, ignoreCase = true) &&
        (uri.port == -1 || uri.port == 443) &&
        !uri.encodedAuthority.orEmpty().contains('@')

    private fun routeNavigation(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase(Locale.ROOT) ?: return true
        if (scheme == "about" && uri.toString() == "about:blank") return false
        if (isTrustedOrigin(uri)) return false
        if (scheme in setOf("https", "mailto", "tel", "sms")) {
            try {
                startActivity(Intent(Intent.ACTION_VIEW, uri).apply {
                    addCategory(Intent.CATEGORY_BROWSABLE)
                })
                toast(R.string.opening_external)
            } catch (_: ActivityNotFoundException) {
                toast(R.string.cannot_open_link)
            } catch (_: SecurityException) {
                toast(R.string.blocked_insecure)
            }
        } else {
            toast(if (scheme == "http") R.string.blocked_http else R.string.blocked_insecure)
        }
        return true
    }

    private fun downloadFile(
        url: String, userAgent: String, disposition: String?, mimeType: String?
    ) {
        val uri = Uri.parse(url)
        if (!isTrustedOrigin(uri)) {
            if (uri.scheme == "https") routeNavigation(uri)
            else toast(R.string.download_unavailable) // blob:, data: no están soportados.
            return
        }
        val proposed = URLUtil.guessFileName(url, disposition, mimeType)
        val filename = proposed.substringAfterLast('/').substringAfterLast('\\')
            .replace(Regex("[^\\p{L}\\p{N}._ -]"), "_")
            .trim('.').take(110).ifBlank { "garciloga-archivo" }
        try {
            val request = DownloadManager.Request(uri).apply {
                setTitle(filename)
                setMimeType(mimeType ?: "application/octet-stream")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                addRequestHeader("User-Agent", userAgent)
                CookieManager.getInstance().getCookie(url)?.let { cookie ->
                    addRequestHeader("Cookie", cookie)
                }
                if (Build.VERSION.SDK_INT >= 29) {
                    @Suppress("DEPRECATION")
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                } else {
                    setDestinationInExternalFilesDir(
                        this@MainActivity, Environment.DIRECTORY_DOWNLOADS, filename
                    )
                }
            }
            val manager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
            manager.enqueue(request)
            toast(R.string.download_started)
        } catch (_: Exception) {
            toast(R.string.download_unavailable)
        }
    }

    private fun buildOfflinePanel(): LinearLayout {
        val surface = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            visibility = View.GONE
            setPadding(dp(28), dp(24), dp(28), dp(24))
            setBackgroundColor(Color.rgb(241, 246, 243))
        }
        val header = TextView(this).apply {
            text = getString(R.string.offline_title)
            textSize = 23f
            setTextColor(Color.rgb(14, 42, 34))
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        val message = TextView(this).apply {
            text = getString(R.string.offline_message)
            textSize = 16f
            setTextColor(Color.rgb(50, 71, 62))
            gravity = Gravity.CENTER
            setPadding(0, dp(16), 0, dp(20))
        }
        val retry = Button(this).apply {
            text = getString(R.string.retry)
            setOnClickListener {
                errorPanel.visibility = View.GONE
                isMainFrameUnavailable = false
                browser.loadUrl(homeUrl)
            }
            contentDescription = getString(R.string.retry)
        }
        surface.addView(header, LinearLayout.LayoutParams(-1, -2))
        surface.addView(message, LinearLayout.LayoutParams(-1, -2))
        surface.addView(retry, LinearLayout.LayoutParams(-2, -2))
        return surface
    }

    private fun showConnectionProblem() {
        isMainFrameUnavailable = true
        progress.visibility = View.GONE
        errorPanel.visibility = View.VISIBLE
    }

    private fun navigateBack() {
        if (browser.canGoBack()) browser.goBack() else finish()
    }

    @Deprecated("Usado para Android 12 e inferiores; en 13+ se usa OnBackInvokedCallback")
    override fun onBackPressed() {
        navigateBack()
    }

    @Deprecated("Compatibilidad con Storage Access Framework sin dependencias AndroidX")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != FILE_PICKER_REQUEST) return
        val callback = fileResult ?: return
        fileResult = null
        if (resultCode != RESULT_OK) {
            callback.onReceiveValue(null)
            return
        }
        val selected = linkedSetOf<Uri>()
        data?.data?.let { if (it.scheme == "content") selected.add(it) }
        val clip: ClipData? = data?.clipData
        if (clip != null) {
            for (i in 0 until clip.itemCount) {
                val itemUri = clip.getItemAt(i).uri
                if (itemUri != null && itemUri.scheme == "content") selected.add(itemUri)
            }
        }
        callback.onReceiveValue(if (selected.isEmpty()) null else selected.toTypedArray())
    }

    override fun onSaveInstanceState(outState: Bundle) {
        browser.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onPause() {
        browser.onPause()
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        browser.onResume()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // Mantener WebView viva para no perder las actividades ni la sesión.
    }

    override fun onDestroy() {
        fileResult?.onReceiveValue(null)
        fileResult = null
        if (Build.VERSION.SDK_INT >= 33) {
            systemBack?.let { onBackInvokedDispatcher.unregisterOnBackInvokedCallback(it) }
        }
        root.removeView(browser)
        browser.stopLoading()
        browser.webChromeClient = null
        browser.webViewClient = WebViewClient()
        browser.destroy()
        super.onDestroy()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun toast(resource: Int) = Toast.makeText(this, resource, Toast.LENGTH_SHORT).show()
}
