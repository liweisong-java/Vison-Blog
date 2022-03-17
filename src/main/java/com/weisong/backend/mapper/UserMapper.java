package com.weisong.backend.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.*;
import com.weisong.backend.entities.User;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Map;


/**
 * @author 李伟松
 * @create 2022-02-16-21:17
 */
@Mapper
@Repository
public interface UserMapper{

    //    注册/添加User
    void insertUser(@Param("user_uuid")String userUuid,
                    @Param("real_name")String realName,
                    @Param("name")String name,
                    @Param("password")String password,
                    @Param("phone")String phone,
                    @Param("qq")String qq,
                    @Param("birth")String birth,
                    @Param("email")String email,
                    @Param("gender")Integer gender,
                    @Param("head_portrait")String avatar,
                    @Param("last_time")String lastTime,
                    @Param("role_id")Integer roleId
                    );

    //    通过UUId 注销/删除User
    void deleteUserById(@Param("user_uuid") String userUuid);

    //    检查User的name是否有重名
    int checkName(String name);

    //    根据name Email查询user
    User findUserByNameOrEmail(@Param("name")String name,@Param("email")String email);

    //根据userUuid查User信息
    User findUserByUuid(@Param("user_uuid") String userUuid);

}
