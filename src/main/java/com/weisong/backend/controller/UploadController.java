package com.weisong.backend.controller;

import com.weisong.backend.entities.User;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.UploadUtils;
import com.weisong.backend.util.UuidBuilderUtils;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpSession;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * @author 李伟松
 * @create 2022-02-26-11:16
 */
@RestController
@RequestMapping(value = "/headPortrait")
public class UploadController {

    @Autowired
    UserService userService;

    @Autowired
    ResourceLoader resourceLoader;

    @SneakyThrows
    @PostMapping("/saveHeadPortrait")
    public String uploadHeadPortrait(MultipartFile file, HttpSession session){

//      获取文件内容
        InputStream is = file.getInputStream();
//      获取原始文件名
        String originalFilename = file.getOriginalFilename();
//      生成一个uuid名称出来
        String uuidFilename = UuidBuilderUtils.getUUIDName(originalFilename);

        File fileDir = new File("D:/HeadPortrait");
        //若文件夹不存在,则创建出文件夹
        if (!fileDir.exists()) {
            fileDir.mkdirs();
        }
        //创建新的文件夹     新的图片
        File newFile = new File("D:/HeadPortrait", uuidFilename);
        //将文件输出到目标的文件中
        file.transferTo(newFile);
        //将保存的文件路径更新到用户信息
        String savePath ="D:/HeadPortrait" + "/" + uuidFilename + "/" + uuidFilename;
        //获取当前的user
        User user = (User) session.getAttribute("user");
        //设置头像图片路径
        user.setHeadPortrait(savePath);
        //调用业务更新user的头像
        userService.uploadHeadPortrait(user);
        return user.getHeadPortrait();
    }

    @GetMapping("/getHeadPortrait")
    public ResponseEntity getHeadPortrait(@PathVariable String filename) {

        //1.根据用户名去获取相应的图片
        Path path = Paths.get(filename);
        //2.将文件加载进来
        Resource resource = resourceLoader.getResource("file:" + path.toString());
        //返回响应实体
        return ResponseEntity.ok(resource);
    }


}
