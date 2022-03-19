package com.weisong.backend.util;

import com.baomidou.mybatisplus.core.toolkit.ClassUtils;
import com.weisong.backend.mapper.UserMapper;
import com.weisong.backend.service.UserService;
import com.weisong.backend.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

/**
 * 文件上传工具包
 */
public class FileUtils {


    public static String PATH = "";
    /**
     * @param file 文件
     * @param
     * @return
     */
    public String upload(MultipartFile file){
        String targetStatic = ClassUtils.getDefaultClassLoader().getResource("").getPath() + "static/";
        String imgDir = "hard/";

        File dest1 = new File(targetStatic + imgDir);
        //判断文件父目录是否存在
        if(!dest1 .exists()  && !dest1.isDirectory()) {
            dest1.mkdir();
        }

        // 生成新的文件路径+名
        String fileName = FileNameUtils.getFileName(file.getOriginalFilename());
        PATH = targetStatic + imgDir + fileName;
        File dest = new File(PATH);

        try {
            //保存文件
            file.transferTo(dest);
            return imgDir + fileName;
        } catch (Exception e) {
            e.printStackTrace();
            return "图片保存失败";
        }
    }


}