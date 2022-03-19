package com.weisong.backend.controller;


import com.weisong.backend.Token.UserLoginToken;
import com.weisong.backend.mapper.UserMapper;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.BaseUserInfo;
import com.weisong.backend.util.FileNameUtils;
import com.weisong.backend.util.FileUtils;
import com.weisong.backend.util.Result.BlogJSONResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value = "/user")
public class avatarController {

    @Autowired
    UserMapper userMapper;
    @Autowired
    UserService userService;
    @Value("${web.upload-path}")
    private String staticPath;

    /**
     *
     * @param file 要上传的文件
     * @return
     */
    @UserLoginToken
    @PostMapping("/avatar")
    public BlogJSONResult upload(@RequestParam("avatar") MultipartFile file){
        FileUtils fileUtils = new FileUtils();
        String Path = fileUtils.upload(file);

        /**
         * 保存图片新路径到数据库
         */
        userMapper.avatarPathName(Path, BaseUserInfo.get("userUuid"));
        return BlogJSONResult.ok(Path);


    }


}