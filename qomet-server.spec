# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all, collect_submodules

uvicorn_datas,  uvicorn_bins,  uvicorn_hidden  = collect_all('uvicorn')
engineio_datas, engineio_bins, engineio_hidden  = collect_all('engineio')
socketio_datas, socketio_bins, socketio_hidden  = collect_all('socketio')

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[*uvicorn_bins, *engineio_bins, *socketio_bins],
    datas=[*uvicorn_datas, *engineio_datas, *socketio_datas],
    hiddenimports=[
        *uvicorn_hidden,
        *engineio_hidden,
        *socketio_hidden,
        *collect_submodules('uvicorn'),
        *collect_submodules('engineio'),
        *collect_submodules('socketio'),
        'anyio._backends._asyncio',
        'anyio._backends._trio',
        'h11',
        'h11._readers',
        'h11._writers',
        'starlette.routing',
        'starlette.responses',
        'starlette.staticfiles',
        'starlette.middleware.cors',
        'fastapi.staticfiles',
        'fastapi.responses',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='qomet-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
