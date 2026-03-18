from django.http import JsonResponse, HttpResponse
from django.utils import timezone

def health_check(request):
    """
    Simple health check view to confirm backend is running.
    """
    # HTML version for browser visibility
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hostel Management Backend - Status</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #0f172a;
                color: #f1f5f9;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                overflow: hidden;
            }
            .container {
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(10px);
                padding: 3rem;
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                text-align: center;
                max-width: 500px;
                animation: fadeIn 0.8s ease-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .status-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid rgba(34, 197, 94, 0.3);
                border-radius: 9999px;
                color: #4ade80;
                font-weight: 600;
                margin-bottom: 1.5rem;
            }
            .status-dot {
                width: 10px;
                height: 10px;
                background: #22c55e;
                border-radius: 50%;
                margin-right: 8px;
                box-shadow: 0 0 10px #22c55e;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 0.8; }
            }
            h1 {
                font-size: 2.5rem;
                background: linear-gradient(to right, #6366f1, #a855f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0 0 1rem 0;
            }
            p {
                color: #94a3b8;
                font-size: 1.1rem;
                line-height: 1.6;
            }
            .time {
                margin-top: 2rem;
                font-family: monospace;
                color: #64748b;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="status-badge">
                <div class="status-dot"></div>
                Backend is Running
            </div>
            <h1>Hostel Management API</h1>
            <p>The backend services are operational and responding correctly. You can now use the frontend to interact with the system.</p>
            <div class="time">Server Time: """ + timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC") + """</div>
        </div>
    </body>
    </html>
    """
    
    # Check if the user wants JSON (often for health checks from tools)
    if 'application/json' in request.headers.get('Accept', ''):
        return JsonResponse({
            "status": "online",
            "message": "Backend is running",
            "project": "Hostel Management System",
            "timestamp": timezone.now().isoformat()
        })
    
    return HttpResponse(html_content)
