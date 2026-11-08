"""Authored furniture, in metres. Physical seams and connected mechanisms.

Reference: Kwadron KW400 proportions and adjustable supports; spring-balanced
task-lamp construction. This is an original model, not a branded product replica.
"""

threadmat = mat('Upholstery charcoal thread', (.048,.052,.053), 0, .80)
lined = mat('Lamp reflector ceramic', (.79,.81,.76), .08, .30)

def rounded_rect(width, length, radius, steps=10):
    pts=[]
    for cx,cy,start in [(width/2-radius,length/2-radius,0),
                        (-width/2+radius,length/2-radius,pi/2),
                        (-width/2+radius,-length/2+radius,pi),
                        (width/2-radius,-length/2+radius,3*pi/2)]:
        for i in range(steps):
            a=start+i*pi/(2*(steps-1))
            pts.append((cx+radius*cos(a),cy+radius*sin(a)))
    return pts

def pillow(name, centre, width, length, thick, rotation=(0,0,0), radius=.07):
    """Rounded upholstery loft with a crowned face, welt in its side seam,
    and stitches on the actual face (never floating across a chamfer)."""
    contour=rounded_rect(width,length,min(radius,width*.22,length*.22),12)
    rings=[(.89,-thick*.48),(.97,-thick*.38),(1,-thick*.13),
           (1,thick*.13),(.985,thick*.30),(.95,thick*.43),
           (.85,thick*.52),(.60,thick*.58),(.20,thick*.60)]
    verts=[];faces=[];n=len(contour)
    for s,z in rings:
        verts += [(x*s,y*s,z) for x,y in contour]
    for ring in range(len(rings)-1):
        for i in range(n):
            a=ring*n+i;b=ring*n+(i+1)%n
            faces.append((a,b,b+n,a+n))
    faces.append(tuple(reversed(range(n))))
    verts.append((0,0,thick*.60));c=len(verts)-1
    for i in range(n):faces.append(((len(rings)-1)*n+i,(len(rings)-1)*n+(i+1)%n,c))
    obj=mesh_object(name,verts,faces,black);obj.location=centre;obj.rotation_euler=rotation
    for p in obj.data.polygons:p.use_smooth=True
    project_uv(obj,black)
    bpy.context.view_layer.update();transform=obj.matrix_world.copy()
    def xyz(x,y,z):return transform@Vector((x,y,z))
    tube(name+' | continuous sewn welt',[xyz(x*.998,y*.998,thick*.14) for x,y in contour],.0017,threadmat,True)
    # A continuous stitch follows the crowned face; every dash has real length.
    path=rounded_rect(width*.922,length*.922,min(radius*.83,width*.19,length*.19),18)
    for i in range(len(path)):
        a=Vector(path[i]);b=Vector(path[(i+1)%len(path)]);distance=(b-a).length
        pieces=max(1,int(distance/.008))
        for j in range(pieces):
            p=a.lerp(b,j/pieces);q=a.lerp(b,(j+.42)/pieces)
            tube(name+' | saddle stitch',[xyz(p.x,p.y,thick*.47),xyz(q.x,q.y,thick*.47)],.00042,threadmat)
    return obj

def screw(name, centre, radius=.013, axis=(0,1,0), metalmat=None):
    axis=Vector(axis).normalized();c=Vector(centre);material=metalmat or metal
    rod(name+' | washer',c-axis*.002,c+axis*.002,radius*1.24,material)
    obj=cyl(name+' | hex socket head',c+axis*.005,radius,.008,material,vertices=32)
    obj.rotation_euler=axis.to_track_quat('Z','Y').to_euler()
    obj=cyl(name+' | inset hex recess',c+axis*.0094,radius*.46,.0006,rubber,vertices=6)
    obj.rotation_euler=axis.to_track_quat('Z','Y').to_euler()

def build_chair(x,y):
    # Tapered base, four stable feet, hydraulic column with a polished moving ram.
    turned('Chair | tapered cast base',(x,y,.085),[(0,.37),(.018,.45),(.065,.44),(.095,.28),(.105,.24)],darkmetal,64)
    for a in [pi/4,3*pi/4,5*pi/4,7*pi/4]:
        end=(x+.46*cos(a),y+.46*sin(a),.09)
        obj=box('Chair | cast stabilising foot',((x+end[0])/2,(y+end[1])/2,.115),(.49,.105,.08),darkmetal,.035,rot=(0,0,a))
        cyl('Chair | rubber levelling pad',end,.063,.025,rubber,vertices=32)
    turned('Chair | hydraulic barrel',(x,y,.17),[(0,.15),(.018,.16),(.21,.13),(.28,.105),(.295,.105)],darkmetal,64)
    turned('Chair | pump collar',(x,y,.44),[(0,.108),(.008,.115),(.022,.115),(.028,.095)],metal,64)
    cyl('Chair | polished lifting ram',(x,y,.585),.068,.29,chrome,vertices=64)
    tube('Chair | oil seal',[(x+.071*cos(i*pi/32),y+.071*sin(i*pi/32),.463) for i in range(64)],.004,rubber,True)
    box('Chair | seat swivel plate',(x,y,.743),(.51,.51,.07),darkmetal,.024)
    for xx in [-.24,.24]:
        box('Chair | seat support rail',(x+xx,y,.79),(.045,.66,.055),darkmetal,.009)
        for yy in [-.23,.23]:screw('Chair | seat fixing',(x+xx,y+yy,.819),.009,(0,0,1))
    pillow('Chair | sculpted seat',(x,y-.01,.86),.66,.66,.132,radius=.10)
    # Back has independent lumbar, shoulder and head elements, without fake tufting.
    rot=(math.radians(70),0,0)
    lower=(x,y+.34,1.12);upper=(x,y+.47,1.47);head=(x,y+.58,1.83)
    pillow('Chair | lumbar pad',lower,.38,.33,.125,rot,.07)
    pillow('Chair | shoulder pad',upper,.68,.42,.145,rot,.08)
    pillow('Chair | adjustable head cushion',head,.38,.25,.12,rot,.065)
    for xx in [-.19,.19]:
        rod('Chair | back steel rail',(x+xx,y+.36,.82),(x+xx,y+.62,1.64),.019,darkmetal)
    for xx in [-.105,.105]:
        rod('Chair | headrest adjustment rods',(x+xx,y+.61,1.56),(x+xx,y+.69,1.83),.010,chrome)
    for s in [-1,1]:
        sx=x+s*.31
        screw('Chair | back recline axle',(sx,y+.30,.86),.032,(s,0,0))
        box('Chair | recline hinge plate',(sx,y+.32,.91),(.019,.16,.20),darkmetal,.025)
    rod('Chair | recline gas strut',(x+.255,y-.13,.69),(x+.255,y+.38,1.03),.024,metal)
    rod('Chair | recline piston',(x+.255,y+.25,.94),(x+.255,y+.49,1.19),.010,chrome)
    # Split, independently supported leg rests; frame does not poke through foam.
    for s in [-1,1]:
        lx=x+s*.17
        pillow('Chair | independent calf cushion',(lx,y-.63,.66),.315,.57,.12,(math.radians(28),0,0),.065)
        pillow('Chair | independent heel cushion',(lx,y-.99,.43),.315,.255,.10,(math.radians(28),0,0),.065)
        rod('Chair | leg slider',(lx,y-.24,.75),(lx,y-1.05,.31),.014,chrome)
        box('Chair | leg hinge clevis',(lx,y-.31,.75),(.10,.10,.07),darkmetal,.012)
        screw('Chair | calf adjustment hinge',(lx+s*.055,y-.31,.75),.018,(s,0,0))
        cyl('Chair | leg release knob',(lx+s*.065,y-.69,.53),.026,.035,rubber,rot=(0,pi/2,0),vertices=24)
    # Adjustable arm cradles, gently angled outwards, clamped to chromed columns.
    for s in [-1,1]:
        ax=x+s*.445
        rod('Chair | arm bracket',(x+s*.28,y+.06,.77),(ax,y+.06,.86),.021,darkmetal)
        rod('Chair | armrest riser',(ax,y+.06,.84),(ax,y+.06,1.18),.016,chrome)
        turned('Chair | armrest collar',(ax,y+.06,.95),[(0,.026),(.012,.026),(.084,.023),(.09,.023)],darkmetal,32)
        cyl('Chair | arm height thumbscrew',(ax+s*.034,y+.06,1.01),.027,.025,rubber,rot=(0,pi/2,0),vertices=20)
        pillow('Chair | articulated arm cushion',(ax,y-.06,1.23),.19,.53,.095,(0,s*.045,s*-.055),.055)
        box('Chair | arm steel underside',(ax,y-.06,1.168),(.14,.43,.022),darkmetal,.025)
    rod('Chair | foot pump lever',(x-.10,y-.1,.22),(x-.35,y-.44,.15),.016,chrome)
    box('Chair | ribbed pump pedal',(x-.36,y-.47,.16),(.19,.12,.032),rubber,.012)
    for i in range(6):box('Chair | pump pedal tread',(x-.43+i*.027,y-.47,.18),(.009,.095,.006),threadmat,.002)

def helix(name,a,b,radius,wire,material,turns=14):
    a,b=Vector(a),Vector(b);d=(b-a).normalized();side=d.cross(Vector((0,1,0))).normalized();up=d.cross(side)
    pts=[]
    for i in range(turns*12+1):
        t=i/(turns*12);theta=t*turns*pi*2
        pts.append(a.lerp(b,t)+(side*cos(theta)+up*sin(theta))*radius)
    return tube(name,pts,wire,material)

def build_lamp():
    x,y=1.39,.38
    turned('Lamp | weighted cast floor base',(x,y,.065),[(0,.255),(.014,.28),(.044,.28),(.064,.25),(.071,.15),(.074,.06)],darkmetal,64)
    cyl('Lamp | telescoping lower tube',(x,y,.68),.021,1.15,darkmetal,vertices=48)
    cyl('Lamp | chrome height collar',(x,y,1.19),.026,.042,metal,vertices=48)
    cyl('Lamp | extension',(x,y,1.32),.016,.22,chrome,vertices=48)
    a=Vector((x,y,1.44));b=Vector((1.02,.38,1.99));c=Vector((.50,.24,2.31))
    # Two steel flats for each parallelogram, with actual pivot discs and bolts.
    for start,end in [(a,b),(b,c)]:
        d=end-start;length=d.length;mid=(start+end)/2
        for offset in [-.035,.035]:
            obj=box('Lamp | parallel flat arm',mid+Vector((0,offset,0)),(.032,.014,length),darkmetal,.004)
            obj.rotation_euler=d.to_track_quat('Z','Y').to_euler()
        for off in [-.047,.047]:
            for pivot in [start,end]:
                rod('Lamp | shoulder pivot disc',pivot+Vector((0,off-.009,0)),pivot+Vector((0,off+.009,0)),.041,darkmetal)
        for off in [-.054,.054]:screw('Lamp | socket pivot',start+Vector((0,off,0)),.014,(0,-1 if off<0 else 1,0))
        # Coil springs span only the bottom third, anchored to metal eyelets.
        sa=start.lerp(end,.12)+Vector((.05,-.015,0));sb=start.lerp(end,.54)+Vector((.05,-.015,0))
        helix('Lamp | tension coil',sa,sb,.012,.0016,chrome,18)
        for p in [sa,sb]:rod('Lamp | spring anchor',p-Vector((0,.015,0)),p+Vector((0,.015,0)),.005,metal)
    screw('Lamp | terminal pivot',c+Vector((0,-.05,0)),.015,(0,-1,0))
    rod('Lamp | swivel neck',c,(.43,.21,2.23),.012,chrome)
    # Spun enamel shade: inside and outside are separate physically thin walls.
    top=(.43,.21,2.255)
    profile=[(0,.035),(-.025,.042),(-.06,.078),(-.115,.128),(-.17,.175),(-.205,.188),(-.212,.186)]
    turned('Lamp | spun black outer shade',top,profile,darkmetal,64)
    turned('Lamp | ceramic reflector',top,[(z,max(.002,r-.004)) for z,r in profile],lined,64)
    tube('Lamp | rolled shade lip',[(top[0]+.186*cos(i*pi/32),top[1]+.186*sin(i*pi/32),top[2]-.21) for i in range(64)],.0035,chrome,True)
    cyl('Lamp | ceramic bulb holder',(top[0],top[1],top[2]-.06),.022,.07,lined,vertices=32)
    sphere('Lamp | frosted LED bulb',(top[0],top[1],top[2]-.13),(.035,.035,.045),warm)
    for i in range(8):
        a=i*pi/4
        rod('Lamp | cooling vent',(top[0]+.043*cos(a),top[1]+.043*sin(a),top[2]-.024),(top[0]+.048*cos(a),top[1]+.048*sin(a),top[2]-.043),.0025,rubber)
    # Cloth cable follows the arms with a slack loop around each pivot.
    tube('Lamp | braided supply cord',[(x+.025,y+.04,.13),(x+.025,y+.04,1.38),(1.44,.42,1.48),(1.24,.43,1.74),(1.05,.42,2.01),(.94,.42,2.02),(.72,.32,2.17),(.51,.28,2.31),(.43,.23,2.28)],.003,rubber)
