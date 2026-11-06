"""Workshop equipment, built in metres. Loaded by build_studio.py."""

enamel = mat('Baked black satin enamel', (.011, .014, .016), .48, .31)
pet = mat('Ink bottle • polished smoked PET', (.007, .009, .011), .02, .22)
nozzle = mat('Frosted precision nozzle', (.61, .66, .64), 0, .31)
bronze = mat('Milled brass fittings', (.43, .26, .082), .89, .28)
label = mat('Printed pigment label atlas', (.6,.6,.56), 0, .42)
label_image = label.node_tree.nodes.new('ShaderNodeTexImage')
label_image.image = bpy.data.images.load(os.path.join(TEX, 'ink-labels.jpg'))
label.node_tree.links.new(label_image.outputs['Color'], label.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

def mesh_object(name, vertices, faces, material):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return apply(obj, material, name)

def turned(name, centre, profile, material, sides=40, flute=0, row=None, rotation=0):
    """Revolved product profile. Optional periodic flutes form a molded cap."""
    vertices, faces = [], []
    for height, radius in profile:
        for i in range(sides + 1):
            a = pi/2 + 2*pi*i/sides + rotation
            adjusted = radius * (1 - flute * (i % 2))
            vertices.append((adjusted*cos(a), adjusted*sin(a), height))
    stride = sides + 1
    for ring in range(len(profile)-1):
        for i in range(sides):
            p = ring*stride+i
            faces.append((p,p+1,p+stride+1,p+stride))
    obj = mesh_object(name, vertices, faces, material)
    obj.location = centre
    for face in obj.data.polygons: face.use_smooth = True
    if row is not None:
        uv = obj.data.uv_layers.new(name='Print UV')
        z0,z1 = profile[0][0],profile[-1][0]
        for poly in obj.data.polygons:
            for loop_index in poly.loop_indices:
                v = obj.data.loops[loop_index].vertex_index
                u = (v%stride)/sides
                t = (profile[v//stride][0]-z0)/(z1-z0)
                uv.data[loop_index].uv=(u,(4-row+t*.982+.009)/5)
    return obj

def bottle(name,x,y,z,r=.028,h=.15,row=0,dispenser=False,turn=0):
    # Base heel, cylindrical body, broad round shoulders, neck and tamper ring.
    profile = [(0,0),(.008,.73),(.018,.93),(.040,1),(.50,1),(.555,.99),
               (.595,.97),(.636,.91),(.673,.82),(.706,.70),(.735,.54),
               (.748,.47),(.76,.46),(.78,.47),(.786,.50),(.793,.50),(.80,.45)]
    turned(name+' | molded bottle',(x,y,z),[(a*h,b*r) for a,b in profile],pet,40)
    turned(name+' | wrap label',(x,y,z),[(.065*h,1.006*r),(.537*h,1.006*r)],label,48,row=row,rotation=turn)
    turned(name+' | ribbed screw cap',(x,y,z),[(.774*h,.48*r),(.783*h,.545*r),(.84*h,.545*r),(.853*h,.53*r),(.857*h,.46*r)],enamel,80,.055)
    if dispenser:
        turned(name+' | pump neck',(x,y,z),[(.852*h,.38*r),(.88*h,.38*r),(.89*h,.17*r),(.98*h,.17*r)],metal,28)
        box(name+' | pump actuator',(x+.011,y,z+h*.984),(.068,.028,.014),pet,.005)
        rod(name+' | downturned spout',(x+.04,y,z+h*.984),(x+.04,y,z+h*.947),.0038,pet)
    else:
        turned(name+' | measured taper',(x,y,z),[(.855*h,.40*r),(.87*h,.37*r),(.907*h,.32*r),(.98*h,.155*r),(.996*h,.122*r),(h,.06*r)],nozzle,28)
        cyl(name+' | nozzle aperture',(x,y,z+h+.0001),r*.045,.0004,rubber,vertices=12)

def basket(name, x, y, z, width, depth, height):
    # Actual open expanded-metal shelf. Two diagonal sets of flat steel strands
    # are batched into a single mesh. No transparent texture or alpha sorting.
    vertices, faces = [], []
    for sign in (-1,1):
        count = math.ceil((width+depth)/.024)
        for i in range(count):
            k=-depth+i*.024
            x0=max(0,k); x1=min(width,k+depth)
            if x1<=x0: continue
            y0=x0-k; y1=x1-k
            if sign<0:y0=depth-y0;y1=depth-y1
            a=len(vertices)
            vertices += [(x-width/2+x0,y-depth/2+y0-.0016,z),(x-width/2+x0,y-depth/2+y0+.0016,z),
                         (x-width/2+x1,y-depth/2+y1+.0016,z),(x-width/2+x1,y-depth/2+y1-.0016,z)]
            faces.append((a,a+1,a+2,a+3))
    mesh_object(name+' expanded metal', vertices, faces, enamel)
    for yy in (y-depth/2,y+depth/2):
        box(name+' folded side',(x,yy,z+height/2),(width,.009,height),enamel,.003)
        box(name+' rolled edge',(x,yy-.002,z+height),(width,.013,.008),metal,.003)
    for xx in (x-width/2,x+width/2):
        box(name+' side return',(xx,y,z+height/2),(.009,depth,height),enamel,.003)

def capsule_tray(name, x, y, z, w, d):
    # Pressed metal stadium-shaped dish with a rolled lip and a recessed floor.
    rings=[(0,.82),(.002,.86),(.006,.91),(.013,.98),(.014,1),(.011,1.008),(.009,.985),(.002,.92),(0,.82)]
    v=[];f=[]
    for h,s in rings:
        radius=d*.5*s; straight=(w-d)*.5*s
        for side in (0,1):
            for i in range(17):
                a=-pi/2+i*pi/16+side*pi
                v.append((x+(straight if side==0 else -straight)+radius*cos(a),y+radius*sin(a),z+h))
    for j in range(len(rings)-1):
        for i in range(34):f.append((j*34+i,j*34+(i+1)%34,(j+1)*34+(i+1)%34,(j+1)*34+i))
    f.append(tuple(range(34)))
    dish=mesh_object(name,v,f,chrome)
    for poly in dish.data.polygons:poly.use_smooth=True
    return dish

def tool_cart(x,y):
    for direction in (-1,1):
        xx=x+direction*.465
        # Bent continuous side frames and capped square uprights, like the reference.
        for d in (-1,1):
            yy=y+d*.264
            box('Cart | square section upright',(xx,yy,.66),(.026,.032,1.08),enamel,.006)
            cyl('Cart | caster swivel pin',(xx,yy,.137),.011,.07,metal)
            for dx in (-.023,.023):box('Cart | caster fork',(xx+dx,yy-.013,.103),(.007,.046,.072),enamel,.007)
            cyl('Cart | polyurethane caster',(xx,yy-.014,.079),.055,.037,rubber,rot=(0,pi/2,0),vertices=28)
            cyl('Cart | wheel hub',(xx,yy-.014,.079),.019,.046,metal,rot=(0,pi/2,0),vertices=18)
            cyl('Cart | axle nut',(xx+.026,yy-.014,.079),.008,.008,bronze,rot=(0,pi/2,0),vertices=6)
        path=[(xx,y-.264,1.17),(xx,y-.264,1.25)]
        for i in range(9):
            a=pi-i*pi/16;path.append((xx,y-.223+.041*cos(a),1.248+.041*sin(a)))
        for i in range(9):
            a=pi/2-i*pi/16;path.append((xx,y+.223+.041*cos(a),1.248+.041*sin(a)))
        path.append((xx,y+.264,1.17))
        tube('Cart | bent enamel handle',path,.014,enamel)
    basket('Cart | organised instruments',x,y,.635,.92,.51,.044)
    basket('Cart | folded supplies',x,y,.205,.92,.51,.063)
    box('Cart | black enamel counter',(x,y,1.105),(.95,.55,.026),enamel,.009)
    for yy in (y-.274,y+.274):box('Cart | steel counter return',(x,yy,1.105),(.942,.005,.012),metal,.0015)
    box('Cart | absorbent charcoal mat',(x,y,1.122),(.86,.452,.007),rubber,.003)
    for i in range(5):
        bottle('Pigment '+str(i+1),x-.32+i*.139,y+.135,1.126,.027+i%2*.002,.146+i%2*.015,i%4,turn=(i-2)*.065)
    # Organized middle packs and lower cartons replace the oversized stacked blocks.
    for side in (-1,1):
        xx=x+side*.21
        box('Cart | partitioned supply carton',(xx,y,.279),(.35,.35,.142),paper,.004)
        for i in range(7):
            box('Stock | standing sealed packet',(xx,y-.132+i*.043,.35),(.28,.013,.15+i%3*.012),offwhite,.003,rot=(.07,0,.012*(i%2)))
            box('Stock | packet ink band',(xx,y-.139+i*.043,.401),(.26,.001,.013),enamel,.001)
        for i in range(5):
            box('Cart | flat packet',(xx,y+.15-i*.071,.653+i%2*.004),(.29,.065,.015),offwhite,.004)
            box('Cart | seal stripe',(xx+.108,y+.15-i*.071,.662+i%2*.004),(.019,.056,.001),blue,.001)
    # Foreground caps are hollow with a flared foot, lip and dark ink meniscus.
    for i in range(4):
        xx=x+.095+i*.063
        turned('Ink cap | flared lip',(xx,y-.17,1.127),[(0,.013),(.002,.015),(.004,.012),(.021,.015),(.022,.016),(.024,.016),(.024,.013),(.006,.009)],nozzle,20)
        cyl('Ink cap | meniscus',(xx,y-.17,1.142),.012,.001,pet,vertices=20)

def cut_frame():
    # Extruded contours follow the casting around the two magnet coils. Wound
    # inner splines form actual cut-through holes, including the triangular web.
    data=bpy.data.curves.new('Machined casting with apertures','CURVE')
    data.dimensions='2D';data.fill_mode='BOTH';data.extrude=.0045;data.bevel_depth=.00085;data.bevel_resolution=2
    outer=[(-.061,-.008),(.042,-.008),(.058,.001),(.060,.023),(.052,.036),(.039,.033),(.031,.013),(-.037,.013),(-.039,.068),(-.029,.079),(-.013,.080),(-.015,.092),(-.043,.094),(-.060,.076),(-.065,.018)]
    def outline(points):
        spline=data.splines.new('POLY');spline.points.add(len(points)-1)
        for point,(a,b) in zip(spline.points,points):point.co=(a,b,0,1)
        spline.use_cyclic_u=True
    outline(outer)
    outline([(-.053,.070),(-.047,.065),(-.048,.030),(-.057,.023),(-.057,.061)])
    for x,z,r in [(-.047,.004,.0038),(-.013,.002,.0030),(.021,.003,.0032),(.048,.014,.004)]:
        outline([(x+r*cos(-i*2*pi/20),z+r*sin(-i*2*pi/20)) for i in range(20)])
    obj=bpy.data.objects.new('Liner | black casting and cutouts',data)
    bpy.context.collection.objects.link(obj);apply(obj,enamel,obj.name);obj.rotation_euler.x=pi/2;obj.location.y=.013

def steel_tip(name, x,y,z, scale=1, angle=0):
    # Hollow tapered tube. Removing a sector from the top half forms the
    # inspection window visible on real steel liner and flat-shader tips.
    v=[];f=[];rings=[(0,.004),(.008,.005),(.032,.009),(.056,.009),(.062,.0105),(.07,.0105)]
    for h,r in rings:
        for i in range(32):
            a=i*2*pi/32
            v.append((r*cos(a)*scale,r*sin(a)*scale,h*scale))
    for j in range(len(rings)-1):
        for i in range(32):
            if 1<=j<=2 and 19<=i<=27:continue
            f.append((j*32+i,j*32+(i+1)%32,(j+1)*32+(i+1)%32,(j+1)*32+i))
    obj=mesh_object(name,v,f,chrome);obj.location=(x,y,z);obj.rotation_euler.y=angle
    for poly in obj.data.polygons:poly.use_smooth=True
    return obj

def liner(x,y,z):
    created=set(bpy.context.scene.objects)
    cut_frame()
    for xx in (-.026,.009):
        turned('Liner | black-wrapped coil',(xx,-.011,.011),[(0,.016),(.003,.019),(.006,.019),(.007,.0158),(.043,.0158),(.045,.0185),(.049,.0185),(.050,.014)],pet,40)
        for h in (.008,.011,.040,.043):
            cyl('Liner | exposed winding',(xx,-.011,.011+h),.016,.0011,bronze,vertices=32)
        cyl('Liner | iron core',(xx,-.011,.064),.009,.009,metal,vertices=24)
    box('Liner | back spring plate',(-.046,-.001,.080),(.038,.021,.003),chrome,.001)
    box('Liner | armature bar',(.004,-.010,.071),(.096,.017,.008),enamel,.0018)
    box('Liner | spring tongue',(.025,-.010,.083),(.053,.011,.0016),metal,.0005,rot=(0,-.19,0))
    cyl('Liner | spring anchor',(-.053,-.009,.086),.006,.006,bronze,vertices=6)
    rod('Liner | contact screw',(-.039,-.012,.103),(.025,-.012,.085),.0029,bronze)
    cyl('Liner | brass binding post',(-.042,-.015,.10),.007,.016,bronze,rot=(pi/2,0,0),vertices=20)
    for xx in (-.048,.016):
        cyl('Liner | cap socket',(xx,.006,.002),.006,.009,darkmetal,rot=(pi/2,0,0),vertices=24)
        cyl('Liner | socket recess',(xx,.0008,.002),.0025,.001,rubber,rot=(pi/2,0,0),vertices=6)
    tube('Liner | coil link',[(-.029,-.025,.027),(-.032,-.032,.018),(-.012,-.033,.011),(.008,-.024,.016)],.0012,pet)
    cyl('Liner | capacitor',(-.042,.029,.037),.009,.037,pet,rot=(0,pi/2,0))
    box('Liner | square vise',(.049,-.004,.019),(.031,.041,.029),enamel,.003)
    rod('Liner | T-bar vise screw',(.045,-.028,.019),(.045,-.051,.019),.0032,bronze)
    rod('Liner | T-bar head',(.034,-.05,.019),(.056,-.05,.019),.0022,metal)
    # Precisely turned grip with two diamond-knurled bands and five flutes.
    gx=.047;gy=-.012
    profile=[(-.099,.0045),(-.096,.011),(-.091,.013),(-.082,.013),(-.079,.012)]
    for i in range(5):
        h=-.077+i*.008
        profile.extend([(h,.013),(h+.001,.014),(h+.004,.014),(h+.006,.0128)])
    profile.extend([(-.034,.013),(-.023,.013),(-.020,.010),(-.019,.006)])
    turned('Liner | machined steel grip',(gx,gy,0),profile,chrome,48)
    # Each diamond is four triangular facets with a raised centre. The resulting
    # highlights follow the actual surface as the camera moves.
    for bottom,top in [(-.091,-.082),(-.034,-.023)]:
        v=[];f=[];n=34;r=.0132
        for j in range(3):
            z0=bottom+(top-bottom)*j/3;z1=bottom+(top-bottom)*(j+1)/3
            for i in range(n):
                a=2*pi*(i+.5*(j%2))/n;b=a+2*pi/n
                def point(t,h,rad):return (gx+rad*cos(t),gy+rad*sin(t),h)
                k=len(v)
                v.extend([point(a,(z0+z1)/2,r),point((a+b)/2,z1,r),point(b,(z0+z1)/2,r),point((a+b)/2,z0,r),point((a+b)/2,(z0+z1)/2,r+.001)])
                for t in range(4):f.append((k+t,k+(t+1)%4,k+4))
        mesh_object('Liner | faceted diamond knurl',v,f,metal)
    cyl('Liner | guide tube',(gx,gy,-.012),.005,.033,metal,vertices=28)
    steel_tip('Liner | open steel tip',gx,gy,-.143,.69)
    rod('Liner | needle grouping',(gx,gy,-.146),(gx,gy,-.105),.0007,metal)
    # The instrument rests crosswise on the curved silicone cradle, tip toward
    # the front left, exposing the casting, coils and grip in the same view.
    rotation = Matrix.Rotation(math.radians(53),4,'Y') @ Matrix.Rotation(math.radians(-13),4,'X')
    matrix=Matrix.Translation(Vector((x,y,z))) @ Matrix.Rotation(math.radians(-15),4,'Z') @ rotation
    bpy.context.view_layer.update()
    for obj in set(bpy.context.scene.objects)-created:obj.matrix_world=matrix@obj.matrix_world
    box('Liner | silicone cradle base',(x-.006,y,1.137),(.208,.114,.02),rubber,.007)
    for xx in (-.056,.034):
        tube('Liner | formed cradle',[ (x+xx,y-.041,1.14),(x+xx,y-.038,z-.012),(x+xx,y-.023,z+.002),(x+xx,y+.017,z-.008),(x+xx,y+.036,z+.004),(x+xx,y+.038,1.14)],.006,enamel)
    # Coiled RCA lead lies flat with enough slack to reach the control box.
    pts=[]
    for i in range(121):
        a=i*3.5*pi/120
        pts.append((x+.175+.09*cos(a),y-.045+.055*sin(a),1.134+i*.000018))
    tube('Liner | removable cable',pts,.0032,pet)
