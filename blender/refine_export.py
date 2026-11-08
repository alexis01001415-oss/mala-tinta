import bpy, os, ast, math
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public','models')
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'blender','studio.blend'))
obj=bpy.data.objects.get('Lamp | ceramic reflector')
if obj and not obj.get('shell_refined'):
    for v in obj.data.vertices:
        # turned() stores the profile around its object-local Z axis.
        radius=math.hypot(v.co.x,v.co.y)
        if radius>0:
            v.co.x*=max(0,radius-.001)/radius
            v.co.y*=max(0,radius-.001)/radius
        v.co.z-=.004
    obj['shell_refined']=True
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','studio.blend'))
source=open(os.path.join(ROOT,'blender','build_studio.py'),encoding='utf8').read()
for n in ast.parse(source).body:
    if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='camera_stops' for t in n.targets):camera_stops=ast.literal_eval(n.value)
scene=bpy.context.scene
exec(compile(source[source.index('# Create a compact web asset:'):],'export_studio','exec'))
