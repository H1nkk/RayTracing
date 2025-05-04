using OpenTK;
using OpenTK.Graphics.OpenGL;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using System.Threading.Tasks;

namespace RayTracingWF
{
    public partial class Form1 : Form
    {
        private View view = new View();
        public Form1()
        {
            InitializeComponent();
        }

        private void glControl1_Load(object sender, EventArgs e)
        {
            view.InitShaders();
            view.BufferObject();
        }

        private void glControl1_Paint(object sender, PaintEventArgs e)
        {
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);
            GL.Enable(EnableCap.DepthTest);
            GL.EnableVertexAttribArray(view.attribute_vpos);
            GL.DrawArrays(PrimitiveType.Quads, 0, 4);
            GL.DisableVertexAttribArray(view.attribute_vpos);

            GL.UseProgram(0);
        }


    }
}
